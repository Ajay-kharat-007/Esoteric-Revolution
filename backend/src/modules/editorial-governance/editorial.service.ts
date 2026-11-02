import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ClaimStatus,
  PublicationStatus,
  RightsStatus,
  WorkflowActionType,
  WorkflowStage,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../database/prisma.service';
import type {
  CreateClaimDto,
  CreateRightsDto,
  CreateSourceDto,
  ReviewClaimDto,
  StartWorkflowDto,
  UpdateRightsDto,
  UpdateSourceDto,
  WorkflowActionDto,
} from './editorial.dto';
@Injectable()
export class EditorialService {
  constructor(private readonly db: PrismaService) {}
  sources() {
    return this.db.source.findMany({ orderBy: { updatedAt: 'desc' } });
  }
  createSource(d: CreateSourceDto) {
    return this.db.source.create({
      data: { ...d, publicationDate: d.publicationDate ? new Date(d.publicationDate) : undefined },
    });
  }
  updateSource(id: string, d: UpdateSourceDto) {
    return this.db.source.update({
      where: { id },
      data: { ...d, publicationDate: d.publicationDate ? new Date(d.publicationDate) : undefined },
    });
  }
  claims() {
    return this.db.claim.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { sources: { include: { source: true } } },
    });
  }
  createClaim(d: CreateClaimDto) {
    return this.db.claim.create({ data: d });
  }
  reviewClaim(id: string, d: ReviewClaimDto) {
    return this.db.claim.update({ where: { id }, data: d });
  }
  linkSource(id: string, sourceId: string, locator?: string) {
    return this.db.claimSource.upsert({
      where: { claimId_sourceId: { claimId: id, sourceId } },
      update: { locator },
      create: { claimId: id, sourceId, locator },
    });
  }
  rights() {
    return this.db.rightsRecord.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { work: { select: { slug: true } } },
    });
  }
  createRights(d: CreateRightsDto) {
    return this.db.rightsRecord.create({
      data: {
        workId: d.workId,
        basis: d.basis,
        territory: d.territory,
        evidenceUrl: d.evidenceUrl,
        startsAt: d.startsAt ? new Date(d.startsAt) : undefined,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : undefined,
        notes: d.notes,
      },
    });
  }
  async updateRights(id: string, d: UpdateRightsDto) {
    const existing = await this.db.rightsRecord.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Rights record not found');
    return this.db.rightsRecord.update({
      where: { id },
      data: { ...d, expiresAt: d.expiresAt ? new Date(d.expiresAt) : undefined },
    });
  }
  async preflight(workId: string) {
    const work = await this.db.work.findUnique({
      where: { id: workId },
      include: {
        versions: { orderBy: { version: 'desc' }, take: 1 },
        claims: true,
        rights: true,
        workflows: { orderBy: { updatedAt: 'desc' }, take: 1 },
      },
    });
    if (!work) throw new NotFoundException('Work not found');
    const blockers: string[] = [];
    if (!work.versions.length) blockers.push('WORK_VERSION_REQUIRED');
    if (
      !work.rights.some(
        (r) => r.status === RightsStatus.CLEARED && (!r.expiresAt || r.expiresAt > new Date()),
      )
    )
      blockers.push('ACTIVE_RIGHTS_CLEARANCE_REQUIRED');
    if (work.claims.some((c) => c.status !== ClaimStatus.VERIFIED))
      blockers.push('ALL_CLAIMS_MUST_BE_VERIFIED');
    if (!work.workflows.some((w) => w.stage === WorkflowStage.APPROVED))
      blockers.push('APPROVED_WORKFLOW_REQUIRED');
    return { ready: blockers.length === 0, blockers };
  }
  async start(d: StartWorkflowDto) {
    const version = await this.db.workVersion.findFirst({
      where: { id: d.workVersionId, workId: d.workId },
      select: { id: true },
    });
    if (!version) throw new BadRequestException('Work version does not belong to this work');
    const active = await this.db.editorialWorkflow.findFirst({
      where: {
        workId: d.workId,
        workVersionId: d.workVersionId,
        stage: { notIn: [WorkflowStage.PUBLISHED, WorkflowStage.ARCHIVED] },
      },
    });
    if (active) throw new ConflictException('Active workflow already exists');
    return this.db.editorialWorkflow.create({
      data: {
        workId: d.workId,
        workVersionId: d.workVersionId,
        assigneeId: d.assigneeId,
        stage: WorkflowStage.RESEARCH_REVIEW,
      },
    });
  }
  workflows() {
    return this.db.editorialWorkflow.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        work: { select: { slug: true } },
        assignee: { select: { id: true, email: true } },
        actions: { orderBy: { createdAt: 'asc' } },
      },
    });
  }
  async action(id: string, actorId: string, roles: string[], d: WorkflowActionDto) {
    const wf = await this.db.editorialWorkflow.findUnique({ where: { id } });
    if (!wf) throw new NotFoundException('Workflow not found');
    if (wf.assigneeId && wf.assigneeId !== actorId && !roles.includes('admin'))
      throw new ForbiddenException('Workflow assignee required');
    const transitions: Partial<Record<WorkflowStage, WorkflowStage[]>> = {
      [WorkflowStage.RESEARCH_REVIEW]: [WorkflowStage.EDITORIAL_REVIEW],
      [WorkflowStage.EDITORIAL_REVIEW]: [WorkflowStage.RIGHTS_REVIEW],
      [WorkflowStage.CHANGES_REQUESTED]: [WorkflowStage.RESEARCH_REVIEW],
    };
    let to: WorkflowStage;
    if (d.action === 'REQUEST_CHANGES') {
      if (
        !(
          [
            WorkflowStage.RESEARCH_REVIEW,
            WorkflowStage.EDITORIAL_REVIEW,
            WorkflowStage.RIGHTS_REVIEW,
          ] as WorkflowStage[]
        ).includes(wf.stage)
      )
        throw new ConflictException('Changes cannot be requested from this workflow stage');
      if (!d.reason?.trim()) throw new BadRequestException('A reason is required');
      to = WorkflowStage.CHANGES_REQUESTED;
    } else if (d.action === 'APPROVE') {
      if (wf.stage !== WorkflowStage.RIGHTS_REVIEW)
        throw new ConflictException('Only a rights-reviewed workflow can be approved');
      to = WorkflowStage.APPROVED;
    } else {
      if (!d.toStage || !transitions[wf.stage]?.includes(d.toStage))
        throw new ConflictException('Invalid workflow stage transition');
      to = d.toStage;
    }
    return this.db.$transaction(async (tx) => {
      const updated = await tx.editorialWorkflow.update({ where: { id }, data: { stage: to } });
      await tx.workflowAction.create({
        data: {
          workflowId: id,
          actorId,
          type: d.action,
          fromStage: wf.stage,
          toStage: to,
          reason: d.reason,
        },
      });
      return updated;
    });
  }
  async submit(workId: string, actorId: string) {
    const latest = await this.db.workVersion.findFirst({
      where: { workId },
      orderBy: { version: 'desc' },
    });
    if (!latest) throw new BadRequestException('Work version required');
    const existing = await this.db.editorialWorkflow.findFirst({
      where: {
        workId,
        workVersionId: latest.id,
        stage: { notIn: [WorkflowStage.PUBLISHED, WorkflowStage.ARCHIVED] },
      },
    });
    if (existing) throw new ConflictException('Active workflow already exists');
    const wf = await this.db.editorialWorkflow.create({
      data: { workId, workVersionId: latest.id, stage: WorkflowStage.RESEARCH_REVIEW },
    });
    await this.db.auditEvent.create({
      data: { actorId, action: 'WORK_SUBMITTED', resourceType: 'work', resourceId: workId },
    });
    return wf;
  }
  async schedule(workId: string, actorId: string, publishAt: Date) {
    if (!Number.isFinite(publishAt.getTime()) || publishAt <= new Date())
      throw new BadRequestException('Publication date must be in the future');
    const check = await this.preflight(workId);
    if (!check.ready)
      throw new ConflictException({
        message: 'Publication preflight failed',
        blockers: check.blockers,
      });
    const work = await this.db.work.update({
      where: { id: workId },
      data: { status: PublicationStatus.SCHEDULED, publishedAt: publishAt },
    });
    await this.db.auditEvent.create({
      data: {
        actorId,
        action: 'WORK_SCHEDULED',
        resourceType: 'work',
        resourceId: workId,
        metadata: { publishAt: publishAt.toISOString() },
      },
    });
    return work;
  }
  async publish(workId: string, actorId: string) {
    const check = await this.preflight(workId);
    if (!check.ready)
      throw new ConflictException({
        message: 'Publication preflight failed',
        blockers: check.blockers,
      });
    const wf = await this.db.editorialWorkflow.findFirstOrThrow({
      where: { workId, stage: WorkflowStage.APPROVED },
      orderBy: { updatedAt: 'desc' },
    });
    return this.db.$transaction(async (tx) => {
      const lessons = await tx.lesson.findMany({
        where: { module: { workId } },
        select: {
          id: true,
          versions: { orderBy: { version: 'desc' }, take: 1, select: { id: true } },
        },
      });
      for (const lesson of lessons) {
        const latest = lesson.versions[0];
        if (latest) {
          await tx.lesson.update({
            where: { id: lesson.id },
            data: { publishedVersionId: latest.id },
          });
        }
      }
      const work = await tx.work.update({
        where: { id: workId },
        data: {
          status: PublicationStatus.PUBLISHED,
          publishedVersionId: wf.workVersionId,
          publishedAt: new Date(),
        },
      });
      await tx.editorialWorkflow.update({
        where: { id: wf.id },
        data: { stage: WorkflowStage.PUBLISHED },
      });
      await tx.workflowAction.create({
        data: {
          workflowId: wf.id,
          actorId,
          type: WorkflowActionType.PUBLISH,
          fromStage: WorkflowStage.APPROVED,
          toStage: WorkflowStage.PUBLISHED,
        },
      });
      await tx.auditEvent.create({
        data: { actorId, action: 'WORK_PUBLISHED', resourceType: 'work', resourceId: workId },
      });
      return work;
    });
  }
  async archive(workId: string, actorId: string, reason: string) {
    return this.db.$transaction(async (tx) => {
      const work = await tx.work.update({
        where: { id: workId },
        data: { status: PublicationStatus.ARCHIVED },
      });
      const workflow = await tx.editorialWorkflow.findFirst({
        where: { workId, stage: { in: [WorkflowStage.PUBLISHED, WorkflowStage.APPROVED] } },
        orderBy: { updatedAt: 'desc' },
      });
      if (workflow) {
        await tx.editorialWorkflow.update({
          where: { id: workflow.id },
          data: { stage: WorkflowStage.ARCHIVED },
        });
        await tx.workflowAction.create({
          data: {
            workflowId: workflow.id,
            actorId,
            type: WorkflowActionType.ARCHIVE,
            fromStage: workflow.stage,
            toStage: WorkflowStage.ARCHIVED,
            reason,
          },
        });
      }
      await tx.auditEvent.create({
        data: {
          actorId,
          action: 'WORK_ARCHIVED',
          resourceType: 'work',
          resourceId: workId,
          reason,
        },
      });
      return work;
    });
  }
  async correction(workId: string, actorId: string, reason: string) {
    const published = await this.db.work.findUnique({
      where: { id: workId },
      select: {
        publishedVersionId: true,
        publishedVersion: true,
        versions: { orderBy: { version: 'desc' }, take: 1, select: { version: true } },
      },
    });
    if (!published?.publishedVersionId || !published.publishedVersion)
      throw new BadRequestException('Published version required');
    const active = await this.db.editorialWorkflow.findFirst({
      where: { workId, stage: { notIn: [WorkflowStage.PUBLISHED, WorkflowStage.ARCHIVED] } },
    });
    if (active) throw new ConflictException('Active workflow already exists');
    return this.db.$transaction(async (tx) => {
      const source = published.publishedVersion!;
      const version = await tx.workVersion.create({
        data: {
          workId,
          version: (published.versions[0]?.version ?? source.version) + 1,
          title: source.title,
          subtitle: source.subtitle,
          summary: source.summary,
          description: source.description,
          content: source.content ?? undefined,
          coverImageUrl: source.coverImageUrl,
          preview: source.preview ?? undefined,
          references: source.references ?? undefined,
          searchText: source.searchText,
        },
      });
      const workflow = await tx.editorialWorkflow.create({
        data: { workId, workVersionId: version.id, stage: WorkflowStage.EDITORIAL_REVIEW },
      });
      await tx.auditEvent.create({
        data: {
          actorId,
          action: 'CORRECTION_STARTED',
          resourceType: 'work',
          resourceId: workId,
          reason,
          metadata: { sourceVersionId: source.id, correctionVersionId: version.id },
        },
      });
      return workflow;
    });
  }
}
