-- CreateTable
CREATE TABLE "webhook_receipts" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_receipts_provider_processed_at_idx" ON "webhook_receipts"("provider", "processed_at");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_receipts_provider_provider_event_id_key" ON "webhook_receipts"("provider", "provider_event_id");
