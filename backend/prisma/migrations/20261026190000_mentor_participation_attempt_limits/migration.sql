CREATE TABLE "mentor_participation_attempt_limits" (
  "user_id" UUID NOT NULL,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "window_started_at" TIMESTAMPTZ(6),
  "blocked_until" TIMESTAMPTZ(6),

  CONSTRAINT "mentor_participation_attempt_limits_pkey" PRIMARY KEY ("user_id"),
  CONSTRAINT "mentor_participation_attempt_limits_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "mentor_participation_attempt_limits_count_check"
    CHECK ("attempt_count" >= 0)
);