import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DeletionStatus, UserStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../database/prisma.service';
import type { RejectDeletionRequestDto } from './account-deletion-admin.dto';

@Injectable()
export class AccountDeletionAdminService {
  constructor(private readonly db: PrismaService) {}

  requests(status?: DeletionStatus) {
    return this.db.deletionRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { requestedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
            profile: { select: { displayName: true } },
          },
        },
      },
    });
  }

  async complete(id: string) {
    const request = await this.db.deletionRequest.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });
    if (!request) throw new NotFoundException('Deletion request not found');
    if (request.status !== DeletionStatus.REQUESTED && request.status !== DeletionStatus.PROCESSING)
      throw new ConflictException('Deletion request is not eligible for completion');

    const now = new Date();
    return this.db.$transaction(async (tx) => {
      await tx.authSession.updateMany({
        where: { userId: request.userId, revokedAt: null },
        data: { revokedAt: now },
      });
      await tx.userRole.deleteMany({ where: { userId: request.userId } });
      await tx.userProfile.updateMany({
        where: { userId: request.userId },
        data: { displayName: 'Deleted User', preferences: {} },
      });
      await tx.user.update({
        where: { id: request.userId },
        data: {
          email: `deleted+${request.userId}@invalid.local`,
          phone: null,
          passwordHash: null,
          status: UserStatus.DELETED,
          tokenVersion: { increment: 1 },
          emailVerifiedAt: null,
          phoneVerifiedAt: null,
        },
      });
      return tx.deletionRequest.update({
        where: { id },
        data: { status: DeletionStatus.COMPLETED, completedAt: now },
        include: { user: { select: { id: true, email: true, phone: true, status: true } } },
      });
    });
  }

  async reject(id: string, dto: RejectDeletionRequestDto) {
    const request = await this.db.deletionRequest.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!request) throw new NotFoundException('Deletion request not found');
    if (request.status !== DeletionStatus.REQUESTED && request.status !== DeletionStatus.PROCESSING)
      throw new ConflictException('Deletion request is not eligible for rejection');
    return this.db.deletionRequest.update({
      where: { id },
      data: {
        status: DeletionStatus.REJECTED,
        completedAt: new Date(),
        reason: `ADMIN_REJECTED: ${dto.reason}`,
      },
    });
  }
}
