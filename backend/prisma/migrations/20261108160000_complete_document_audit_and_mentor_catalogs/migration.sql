BEGIN;
ALTER TABLE "appointment_documents" ADD COLUMN IF NOT EXISTS "created_at" timestamptz(6), ADD COLUMN IF NOT EXISTS "updated_at" timestamptz(6);
UPDATE "appointment_documents" SET "created_at" = COALESCE("created_at", "uploaded_at", CURRENT_TIMESTAMP), "updated_at" = COALESCE("updated_at", "created_at", "uploaded_at", CURRENT_TIMESTAMP);
ALTER TABLE "appointment_documents" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "created_at" SET NOT NULL, ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" SET NOT NULL;

ALTER TABLE "user_cv_file" ADD COLUMN IF NOT EXISTS "created_at" timestamptz(6), ADD COLUMN IF NOT EXISTS "updated_at" timestamptz(6);
UPDATE "user_cv_file" SET "created_at" = COALESCE("created_at", "cv_uploaded_at", CURRENT_TIMESTAMP), "updated_at" = COALESCE("updated_at", "created_at", "cv_uploaded_at", CURRENT_TIMESTAMP);
ALTER TABLE "user_cv_file" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "created_at" SET NOT NULL, ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" SET NOT NULL;

ALTER TABLE "mentor_slot_offers" ADD COLUMN IF NOT EXISTS "created_at" timestamptz(6), ADD COLUMN IF NOT EXISTS "updated_at" timestamptz(6);
UPDATE "mentor_slot_offers" SET "created_at" = COALESCE("created_at", "offered_at", CURRENT_TIMESTAMP), "updated_at" = COALESCE("updated_at", "created_at", "offered_at", CURRENT_TIMESTAMP);
ALTER TABLE "mentor_slot_offers" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "created_at" SET NOT NULL, ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" SET NOT NULL;

ALTER TABLE mentor_participation_requests ADD COLUMN IF NOT EXISTS updated_at timestamptz(6);
UPDATE mentor_participation_requests SET updated_at = created_at WHERE updated_at IS NULL;
ALTER TABLE mentor_participation_requests ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN updated_at SET NOT NULL;
CREATE FUNCTION touch_mentor_document_audit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := clock_timestamp(); RETURN NEW; END $$;

CREATE TRIGGER "appointment_documents_touch_audit" BEFORE UPDATE ON "appointment_documents" FOR EACH ROW EXECUTE FUNCTION touch_mentor_document_audit();

CREATE TRIGGER "user_cv_file_touch_audit" BEFORE UPDATE ON "user_cv_file" FOR EACH ROW EXECUTE FUNCTION touch_mentor_document_audit();

CREATE TRIGGER "mentor_slot_offers_touch_audit" BEFORE UPDATE ON "mentor_slot_offers" FOR EACH ROW EXECUTE FUNCTION touch_mentor_document_audit();

CREATE TRIGGER "mentor_participation_requests_touch_audit" BEFORE UPDATE ON "mentor_participation_requests" FOR EACH ROW EXECUTE FUNCTION touch_mentor_document_audit();


CREATE TABLE IF NOT EXISTS "mentor_request_statuses" (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title varchar(20) NOT NULL UNIQUE, description text,
 created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
 );
INSERT INTO "mentor_request_statuses" (title) VALUES ('PENDING'),('OFFERED'),('ACTIVE'),('CANCELLED'),('EXPIRED'),('ENDED') ON CONFLICT (title) DO NOTHING;
CREATE OR REPLACE FUNCTION mentor_participation_status(value text) RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT id FROM "mentor_request_statuses" WHERE title = value $$;
ALTER TABLE "mentor_participation_requests" ADD COLUMN IF NOT EXISTS status_id uuid;
UPDATE "mentor_participation_requests" SET status_id = mentor_participation_status(status) WHERE status_id IS NULL;
ALTER TABLE "mentor_participation_requests" ALTER COLUMN status_id SET NOT NULL, ALTER COLUMN status_id SET DEFAULT mentor_participation_status('PENDING');
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"mentor_participation_requests"'::regclass AND contype = 'f' AND confrelid = '"mentor_request_statuses"'::regclass) THEN
 ALTER TABLE "mentor_participation_requests" ADD CONSTRAINT "mentor_participation_requests_status_id_fkey" FOREIGN KEY (status_id) REFERENCES "mentor_request_statuses"(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
 END IF;
END $$;
CREATE INDEX IF NOT EXISTS "mentor_participation_requests_status_id_idx" ON "mentor_participation_requests"(status_id);
DROP TRIGGER IF EXISTS "mentor_participation_requests_status_compat" ON "mentor_participation_requests";
CREATE TRIGGER "mentor_participation_requests_status_compat" BEFORE INSERT OR UPDATE ON "mentor_participation_requests" FOR EACH ROW EXECUTE FUNCTION mentor_sync_legacy_catalog('status', 'status_id', 'mentor_request_statuses');

CREATE TABLE IF NOT EXISTS "mentor_offer_statuses" (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title varchar(20) NOT NULL UNIQUE, description text,
 created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
 );
INSERT INTO "mentor_offer_statuses" (title) VALUES ('OFFERED'),('CONFIRMED'),('EXPIRED') ON CONFLICT (title) DO NOTHING;
CREATE OR REPLACE FUNCTION mentor_offer_status(value text) RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT id FROM "mentor_offer_statuses" WHERE title = value $$;
ALTER TABLE "mentor_slot_offers" ADD COLUMN IF NOT EXISTS status_id uuid;
UPDATE "mentor_slot_offers" SET status_id = mentor_offer_status(status) WHERE status_id IS NULL;
ALTER TABLE "mentor_slot_offers" ALTER COLUMN status_id SET NOT NULL, ALTER COLUMN status_id SET DEFAULT mentor_offer_status('OFFERED');
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"mentor_slot_offers"'::regclass AND contype = 'f' AND confrelid = '"mentor_offer_statuses"'::regclass) THEN
 ALTER TABLE "mentor_slot_offers" ADD CONSTRAINT "mentor_slot_offers_status_id_fkey" FOREIGN KEY (status_id) REFERENCES "mentor_offer_statuses"(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
 END IF;
END $$;
CREATE INDEX IF NOT EXISTS "mentor_slot_offers_status_id_idx" ON "mentor_slot_offers"(status_id);
DROP TRIGGER IF EXISTS "mentor_slot_offers_status_compat" ON "mentor_slot_offers";
CREATE TRIGGER "mentor_slot_offers_status_compat" BEFORE INSERT OR UPDATE ON "mentor_slot_offers" FOR EACH ROW EXECUTE FUNCTION mentor_sync_legacy_catalog('status', 'status_id', 'mentor_offer_statuses');

COMMIT;
