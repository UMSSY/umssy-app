CREATE TABLE "mentor_participation_requests" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "queued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "technical_area_ids" UUID[] NOT NULL,
  "orientation_type_ids" UUID[] NOT NULL,
  CONSTRAINT "mentor_participation_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "mentor_participation_requests_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "mentor_participation_requests_preferences_check" CHECK (
    cardinality("technical_area_ids") > 0 AND cardinality("orientation_type_ids") > 0)
);
CREATE INDEX "mentor_participation_requests_status_queued_at_id_idx"
  ON "mentor_participation_requests"("status", "queued_at", "id");
CREATE UNIQUE INDEX "mentor_participation_requests_one_open_per_user"
  ON "mentor_participation_requests"("user_id") WHERE "status" IN ('PENDING', 'OFFERED');

ALTER TABLE "mentor_slot_offers" ADD COLUMN "request_id" UUID;
ALTER TABLE "mentor_slot_offers" ADD COLUMN "confirmed_at" TIMESTAMPTZ(6);
CREATE UNIQUE INDEX "mentor_slot_offers_request_id_key" ON "mentor_slot_offers"("request_id");
ALTER TABLE "mentor_slot_offers" ADD CONSTRAINT "mentor_slot_offers_request_id_fkey"
  FOREIGN KEY ("request_id") REFERENCES "mentor_participation_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
