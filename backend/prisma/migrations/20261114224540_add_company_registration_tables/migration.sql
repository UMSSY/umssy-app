-- CreateTable
CREATE TABLE "company_profiles" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "sector" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "website_url" VARCHAR(255) NOT NULL,
    "city_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_logos" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(50) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_logos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_access_requests" (
    "id" UUID NOT NULL,
    "request_code" VARCHAR(20),
    "company_name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "sector" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "website_url" VARCHAR(255) NOT NULL,
    "city_id" UUID NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "status_id" UUID NOT NULL,
    "document_file_id" UUID,
    "logo_file_id" UUID,
    "ocr_match_score" SMALLINT,
    "ocr_field_results" JSONB,
    "submitted_at" TIMESTAMPTZ(6),
    "opened_by_id" UUID,
    "opened_at" TIMESTAMPTZ(6),
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "rejection_reason" VARCHAR(500),
    "approved_company_id" UUID,
    "approved_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "accessRequestDocumentTypeId" UUID,

    CONSTRAINT "company_access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_activation_otps" (
    "id" UUID NOT NULL,
    "company_access_request_id" UUID NOT NULL,
    "code_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_activation_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_company_id_key" ON "company_profiles"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_email_key" ON "company_profiles"("email");

-- CreateIndex
CREATE INDEX "company_profiles_city_id_idx" ON "company_profiles"("city_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_logos_company_id_key" ON "company_logos"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_access_requests_request_code_key" ON "company_access_requests"("request_code");

-- CreateIndex
CREATE UNIQUE INDEX "company_access_requests_document_file_id_key" ON "company_access_requests"("document_file_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_access_requests_logo_file_id_key" ON "company_access_requests"("logo_file_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_access_requests_approved_company_id_key" ON "company_access_requests"("approved_company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_access_requests_approved_user_id_key" ON "company_access_requests"("approved_user_id");

-- CreateIndex
CREATE INDEX "company_access_requests_status_id_idx" ON "company_access_requests"("status_id");

-- CreateIndex
CREATE INDEX "company_access_requests_city_id_idx" ON "company_access_requests"("city_id");

-- CreateIndex
CREATE INDEX "company_access_requests_email_idx" ON "company_access_requests"("email");

-- CreateIndex
CREATE INDEX "company_activation_otps_company_access_request_id_idx" ON "company_activation_otps"("company_access_request_id");

-- AddForeignKey
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_logos" ADD CONSTRAINT "company_logos_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_access_requests" ADD CONSTRAINT "company_access_requests_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_access_requests" ADD CONSTRAINT "company_access_requests_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "access_request_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_access_requests" ADD CONSTRAINT "company_access_requests_document_file_id_fkey" FOREIGN KEY ("document_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_access_requests" ADD CONSTRAINT "company_access_requests_logo_file_id_fkey" FOREIGN KEY ("logo_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_access_requests" ADD CONSTRAINT "company_access_requests_opened_by_id_fkey" FOREIGN KEY ("opened_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_access_requests" ADD CONSTRAINT "company_access_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_access_requests" ADD CONSTRAINT "company_access_requests_approved_company_id_fkey" FOREIGN KEY ("approved_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_access_requests" ADD CONSTRAINT "company_access_requests_approved_user_id_fkey" FOREIGN KEY ("approved_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_access_requests" ADD CONSTRAINT "company_access_requests_accessRequestDocumentTypeId_fkey" FOREIGN KEY ("accessRequestDocumentTypeId") REFERENCES "access_request_document_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_activation_otps" ADD CONSTRAINT "company_activation_otps_company_access_request_id_fkey" FOREIGN KEY ("company_access_request_id") REFERENCES "company_access_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
