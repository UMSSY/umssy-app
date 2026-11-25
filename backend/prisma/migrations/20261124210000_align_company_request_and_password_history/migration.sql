BEGIN;

ALTER TABLE "password_histories"
ADD COLUMN "updated_at" TIMESTAMPTZ(6);

UPDATE "password_histories"
SET "updated_at" = "created_at";

ALTER TABLE "password_histories"
ALTER COLUMN "updated_at" SET NOT NULL;

ALTER TABLE "company_access_requests"
RENAME COLUMN "accessRequestDocumentTypeId" TO "access_request_document_type_id";

ALTER TABLE "company_access_requests"
RENAME CONSTRAINT "company_access_requests_accessRequestDocumentTypeId_fkey" TO "company_access_requests_access_request_document_type_id_fkey";

CREATE INDEX "company_access_requests_access_request_document_type_id_idx" ON "company_access_requests"("access_request_document_type_id");

CREATE INDEX "company_access_requests_opened_by_id_idx" ON "company_access_requests"("opened_by_id");

CREATE INDEX "company_access_requests_reviewed_by_id_idx" ON "company_access_requests"("reviewed_by_id");

COMMIT;
