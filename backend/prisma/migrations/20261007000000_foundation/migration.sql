CREATE TABLE "system_records" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "system_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "system_records_key_key" ON "system_records"("key");
