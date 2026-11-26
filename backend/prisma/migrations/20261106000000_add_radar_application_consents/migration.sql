CREATE TABLE "radar_application_consents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "consent_to_recruiter" BOOLEAN NOT NULL DEFAULT false,
    "consent_to_cv" BOOLEAN NOT NULL DEFAULT false,
    "consent_to_contact" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "radar_application_consents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "radar_application_consents_application_id_key" ON "radar_application_consents"("application_id");

ALTER TABLE "radar_application_consents" ADD CONSTRAINT "radar_application_consents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
