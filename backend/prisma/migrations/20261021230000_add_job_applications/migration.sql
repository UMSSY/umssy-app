-- CreateTable
CREATE TABLE "job_application_statuses" (
    "id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "job_application_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" UUID NOT NULL,
    "job_offer_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status_id" UUID NOT NULL,
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_application_statuses_title_key" ON "job_application_statuses"("title");

-- CreateIndex
CREATE INDEX "job_applications_user_id_idx" ON "job_applications"("user_id");

-- CreateIndex
CREATE INDEX "job_applications_status_id_idx" ON "job_applications"("status_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_job_offer_id_user_id_key" ON "job_applications"("job_offer_id", "user_id");

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_offer_id_fkey" FOREIGN KEY ("job_offer_id") REFERENCES "job_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "job_application_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Estados de postulación (HU-02B / HU-05)
INSERT INTO "job_application_statuses" ("id", "title", "updated_at") VALUES
    ('5a000000-0000-4000-8000-000000000001', 'En revisión', CURRENT_TIMESTAMP),
    ('5a000000-0000-4000-8000-000000000002', 'Entrevista', CURRENT_TIMESTAMP),
    ('5a000000-0000-4000-8000-000000000003', 'Aceptada', CURRENT_TIMESTAMP),
    ('5a000000-0000-4000-8000-000000000004', 'No seleccionado', CURRENT_TIMESTAMP)
ON CONFLICT ("title") DO NOTHING;
