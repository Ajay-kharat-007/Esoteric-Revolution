CREATE TABLE "user_notification_states" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "notification_id" UUID NOT NULL,
  "read_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "user_notification_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_notification_states_user_id_notification_id_key"
  ON "user_notification_states"("user_id", "notification_id");
CREATE INDEX "user_notification_states_user_id_deleted_at_idx"
  ON "user_notification_states"("user_id", "deleted_at");

ALTER TABLE "user_notification_states"
  ADD CONSTRAINT "user_notification_states_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_notification_states"
  ADD CONSTRAINT "user_notification_states_notification_id_fkey"
  FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
