BEGIN;

ALTER TABLE "company_access_requests"
DROP CONSTRAINT IF EXISTS "company_access_requests_accessRequestDocumentTypeId_fkey";

ALTER TABLE "company_access_requests"
RENAME COLUMN "accessRequestDocumentTypeId" TO "access_request_document_type_id";

CREATE INDEX "company_access_requests_access_request_document_type_id_idx" ON "company_access_requests"("access_request_document_type_id");

CREATE INDEX "company_access_requests_opened_by_id_idx" ON "company_access_requests"("opened_by_id");

CREATE INDEX "company_access_requests_reviewed_by_id_idx" ON "company_access_requests"("reviewed_by_id");

ALTER TABLE "company_access_requests"
ADD CONSTRAINT "company_access_requests_access_request_document_type_id_fkey"
FOREIGN KEY ("access_request_document_type_id") REFERENCES "access_request_document_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "password_histories"
ADD COLUMN "updated_at" TIMESTAMPTZ(6);

UPDATE "password_histories"
SET "updated_at" = "created_at";

ALTER TABLE "password_histories"
ALTER COLUMN "updated_at" SET NOT NULL;

COMMIT;
