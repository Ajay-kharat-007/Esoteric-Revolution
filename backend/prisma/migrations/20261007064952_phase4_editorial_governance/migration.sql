-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('DRAFT', 'VERIFIED', 'DISPUTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RightsStatus" AS ENUM ('PENDING', 'CLEARED', 'RESTRICTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WorkflowStage" AS ENUM ('DRAFT', 'RESEARCH_REVIEW', 'EDITORIAL_REVIEW', 'RIGHTS_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkflowActionType" AS ENUM ('SUBMIT', 'APPROVE', 'REQUEST_CHANGES', 'TRANSITION', 'PUBLISH', 'ARCHIVE', 'CORRECTION');

-- CreateTable
CREATE TABLE "sources" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "publisher" TEXT,
    "publication_date" TIMESTAMP(3),
    "url" TEXT,
    "isbn" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claims" (
    "id" UUID NOT NULL,
    "work_id" UUID NOT NULL,
    "statement" TEXT NOT NULL,
    "classification" TEXT,
    "status" "ClaimStatus" NOT NULL DEFAULT 'DRAFT',
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_sources" (
    "claim_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "locator" TEXT,

    CONSTRAINT "claim_sources_pkey" PRIMARY KEY ("claim_id","source_id")
);

-- CreateTable
CREATE TABLE "rights_records" (
    "id" UUID NOT NULL,
    "work_id" UUID NOT NULL,
    "basis" TEXT NOT NULL,
    "territory" TEXT NOT NULL DEFAULT 'WORLDWIDE',
    "status" "RightsStatus" NOT NULL DEFAULT 'PENDING',
    "evidence_url" TEXT,
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rights_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editorial_workflows" (
    "id" UUID NOT NULL,
    "work_id" UUID NOT NULL,
    "work_version_id" UUID NOT NULL,
    "stage" "WorkflowStage" NOT NULL DEFAULT 'DRAFT',
    "assignee_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editorial_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_actions" (
    "id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "type" "WorkflowActionType" NOT NULL,
    "from_stage" "WorkflowStage" NOT NULL,
    "to_stage" "WorkflowStage" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sources_title_idx" ON "sources"("title");

-- CreateIndex
CREATE INDEX "claims_work_id_status_idx" ON "claims"("work_id", "status");

-- CreateIndex
CREATE INDEX "rights_records_work_id_status_expires_at_idx" ON "rights_records"("work_id", "status", "expires_at");

-- CreateIndex
CREATE INDEX "editorial_workflows_stage_assignee_id_idx" ON "editorial_workflows"("stage", "assignee_id");

-- CreateIndex
CREATE INDEX "audit_events_resource_type_resource_id_created_at_idx" ON "audit_events"("resource_type", "resource_id", "created_at");

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_sources" ADD CONSTRAINT "claim_sources_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_sources" ADD CONSTRAINT "claim_sources_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rights_records" ADD CONSTRAINT "rights_records_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editorial_workflows" ADD CONSTRAINT "editorial_workflows_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editorial_workflows" ADD CONSTRAINT "editorial_workflows_work_version_id_fkey" FOREIGN KEY ("work_version_id") REFERENCES "work_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editorial_workflows" ADD CONSTRAINT "editorial_workflows_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_actions" ADD CONSTRAINT "workflow_actions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "editorial_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_actions" ADD CONSTRAINT "workflow_actions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
