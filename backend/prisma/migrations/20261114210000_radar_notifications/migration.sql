BEGIN;

CREATE TABLE "radar_notifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "snapshot_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "read_at" TIMESTAMPTZ(6),

  CONSTRAINT "radar_notifications_pkey"
    PRIMARY KEY ("id"),

  CONSTRAINT "radar_notifications_snapshot_id_key"
    UNIQUE ("snapshot_id"),

  CONSTRAINT "radar_notifications_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "radar_notifications_snapshot_id_fkey"
    FOREIGN KEY ("snapshot_id")
    REFERENCES "radar_score_snapshots"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX "radar_notifications_user_created_idx"
ON "radar_notifications"("user_id", "created_at" DESC);

COMMIT;
