ALTER TABLE "works"
  ADD COLUMN "introduction_video_url" TEXT,
  ADD COLUMN "introduction_video_id" VARCHAR(32),
  ADD COLUMN "introduction_video_title" VARCHAR(200),
  ADD COLUMN "introduction_video_caption_info" TEXT;
CREATE INDEX "works_introduction_video_id_idx" ON "works"("introduction_video_id");
