ALTER TABLE "access_requests" ADD COLUMN "approved_user_id" UUID;
CREATE UNIQUE INDEX "access_requests_approved_user_id_key" ON "access_requests"("approved_user_id");
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_approved_user_id_fkey" FOREIGN KEY ("approved_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "mentor_capacity_policies" (
  "id" VARCHAR(20) PRIMARY KEY,
  "percentage" SMALLINT NOT NULL DEFAULT 40,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "mentor_capacity_percentage_check" CHECK ("percentage" BETWEEN 0 AND 100)
);
INSERT INTO "mentor_capacity_policies" ("id", "percentage") VALUES ('GLOBAL', 40);

CREATE TABLE "mentor_participation_requests" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "status" VARCHAR(20) NOT NULL,
  "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "queued_at" TIMESTAMPTZ(6),
  "activated_at" TIMESTAMPTZ(6),
  "cancelled_at" TIMESTAMPTZ(6),
  "left_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "mentor_participation_status_check" CHECK ("status" IN ('PENDING', 'OFFERED', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'LEFT'))
);
CREATE INDEX "mentor_participation_requests_status_queued_at_id_idx" ON "mentor_participation_requests"("status", "queued_at", "id");
CREATE INDEX "mentor_participation_requests_user_id_requested_at_idx" ON "mentor_participation_requests"("user_id", "requested_at");
CREATE UNIQUE INDEX "mentor_participation_current_user_key" ON "mentor_participation_requests"("user_id") WHERE "status" IN ('PENDING', 'OFFERED', 'ACTIVE');

CREATE TABLE "mentor_request_technical_areas" (
  "request_id" UUID NOT NULL REFERENCES "mentor_participation_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "technical_area_id" UUID NOT NULL REFERENCES "technical_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  PRIMARY KEY ("request_id", "technical_area_id")
);
CREATE TABLE "mentor_request_orientation_types" (
  "request_id" UUID NOT NULL REFERENCES "mentor_participation_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "orientation_type_id" UUID NOT NULL REFERENCES "orientation_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  PRIMARY KEY ("request_id", "orientation_type_id")
);

CREATE TABLE "mentor_slot_offers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "request_id" UUID NOT NULL REFERENCES "mentor_participation_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "status" VARCHAR(20) NOT NULL,
  "offered_at" TIMESTAMPTZ(6) NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "confirmed_at" TIMESTAMPTZ(6),
  "expired_at" TIMESTAMPTZ(6),
  "cancelled_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "mentor_offer_status_check" CHECK ("status" IN ('OFFERED', 'CONFIRMED', 'EXPIRED', 'CANCELLED')),
  CONSTRAINT "mentor_offer_expiry_check" CHECK ("expires_at" = "offered_at" + INTERVAL '24 hours')
);
CREATE INDEX "mentor_slot_offers_status_expires_at_idx" ON "mentor_slot_offers"("status", "expires_at");
CREATE UNIQUE INDEX "mentor_offer_current_request_key" ON "mentor_slot_offers"("request_id") WHERE "status" = 'OFFERED';

CREATE TABLE "mentor_email_outbox" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_key" VARCHAR(150) NOT NULL UNIQUE,
  "request_id" UUID NOT NULL REFERENCES "mentor_participation_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "type" VARCHAR(30) NOT NULL,
  "recipient" VARCHAR(150) NOT NULL,
  "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "next_attempt_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "sent_at" TIMESTAMPTZ(6),
  "last_error" VARCHAR(500),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "mentor_email_outbox_status_check" CHECK ("status" IN ('PENDING', 'SENDING', 'SENT')),
  CONSTRAINT "mentor_email_attempts_check" CHECK ("attempts" >= 0)
);
CREATE INDEX "mentor_email_outbox_status_next_attempt_at_idx" ON "mentor_email_outbox"("status", "next_attempt_at");
