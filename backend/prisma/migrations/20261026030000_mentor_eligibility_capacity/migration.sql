ALTER TABLE "access_requests" ADD COLUMN "approved_user_id" UUID;
CREATE UNIQUE INDEX "access_requests_approved_user_id_key" ON "access_requests"("approved_user_id");
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_approved_user_id_fkey"
  FOREIGN KEY ("approved_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "mentor_slot_offers" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'OFFERED',
  "offered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "mentor_slot_offers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "mentor_slot_offers_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "mentor_slot_offers_expiry_check" CHECK ("expires_at" > "offered_at")
);
CREATE INDEX "mentor_slot_offers_status_expires_at_idx" ON "mentor_slot_offers"("status", "expires_at");
CREATE UNIQUE INDEX "mentor_slot_offers_one_offer_per_user" ON "mentor_slot_offers"("user_id")
  WHERE "status" = 'OFFERED';
