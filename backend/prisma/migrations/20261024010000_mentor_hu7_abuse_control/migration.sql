ALTER TABLE "mentor_email_outbox" ALTER COLUMN "request_id" DROP NOT NULL;

CREATE TABLE "mentor_participation_attempts" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "idempotency_key" UUID NOT NULL,
  "payload_hash" VARCHAR(64) NOT NULL,
  "action" VARCHAR(20) NOT NULL,
  "outcome" VARCHAR(30) NOT NULL,
  "counted" BOOLEAN NOT NULL DEFAULT true,
  "status_code" INTEGER NOT NULL,
  "detail" VARCHAR(300),
  "response" JSONB NOT NULL DEFAULT '{}',
  "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mentor_participation_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "mentor_participation_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "mentor_participation_attempts_user_id_idempotency_key_key" ON "mentor_participation_attempts"("user_id", "idempotency_key");
CREATE INDEX "mentor_participation_attempts_user_id_occurred_at_idx" ON "mentor_participation_attempts"("user_id", "occurred_at");

CREATE TABLE "mentor_participation_sanctions" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "reason" VARCHAR(80) NOT NULL,
  "starts_at" TIMESTAMPTZ(6) NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "lifted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mentor_participation_sanctions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "mentor_participation_sanctions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "mentor_participation_sanctions_dates_check" CHECK ("expires_at" > "starts_at")
);
CREATE INDEX "mentor_participation_sanctions_user_id_expires_at_idx" ON "mentor_participation_sanctions"("user_id", "expires_at");
