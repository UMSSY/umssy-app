-- Épica 3 HU4: radar de afinidad para reclutadores.
-- Migración aditiva: no elimina ni renombra columnas existentes.

-- AlterTable
ALTER TABLE "skills" ADD COLUMN "area_id" VARCHAR(50);

-- AlterTable
ALTER TABLE "user_skills" ADD COLUMN "source" VARCHAR(20) NOT NULL DEFAULT 'manual',
ADD COLUMN "verification_status" VARCHAR(20) NOT NULL DEFAULT 'approved',
ADD COLUMN "is_high_relevance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "evidence_refs" JSONB DEFAULT '[]';

-- CreateTable
CREATE TABLE "radar_areas" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "radar_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "radar_areas_name_key" ON "radar_areas"("name");

-- CreateIndex
CREATE INDEX "skills_area_id_idx" ON "skills"("area_id");

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "radar_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- CreateTable
CREATE TABLE "radar_score_snapshots" (
    "user_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "rubric_version" VARCHAR(80) NOT NULL,
    "fingerprint" VARCHAR(64) NOT NULL,
    "scores" JSONB NOT NULL,
    "evidence" JSONB NOT NULL,
    "average_score" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "radar_score_snapshots_pkey" PRIMARY KEY ("user_id","version")
);

-- CreateTable
CREATE TABLE "radar_audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "actor_id" UUID,
    "event_type" VARCHAR(80) NOT NULL,
    "target_id" UUID,
    "details" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "radar_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radar_company_access" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "radar_company_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "job_application_statuses_title_key" ON "job_application_statuses"("title");
CREATE INDEX "job_applications_user_id_idx" ON "job_applications"("user_id");
CREATE INDEX "job_applications_status_id_idx" ON "job_applications"("status_id");
CREATE UNIQUE INDEX "job_applications_job_offer_id_user_id_key" ON "job_applications"("job_offer_id","user_id");
CREATE INDEX "radar_audit_user_idx" ON "radar_audit_events"("user_id","occurred_at" DESC);
CREATE INDEX "radar_audit_events_actor_id_idx" ON "radar_audit_events"("actor_id");
CREATE UNIQUE INDEX "radar_company_access_company_id_user_id_key" ON "radar_company_access"("company_id","user_id");
CREATE INDEX "radar_company_access_user_id_idx" ON "radar_company_access"("user_id");
CREATE UNIQUE INDEX "radar_application_consents_application_id_key" ON "radar_application_consents"("application_id");

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_offer_id_fkey" FOREIGN KEY ("job_offer_id") REFERENCES "job_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "job_application_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "radar_score_snapshots" ADD CONSTRAINT "radar_score_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "radar_audit_events" ADD CONSTRAINT "radar_audit_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "radar_audit_events" ADD CONSTRAINT "radar_audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "radar_company_access" ADD CONSTRAINT "radar_company_access_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "radar_company_access" ADD CONSTRAINT "radar_company_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "radar_application_consents" ADD CONSTRAINT "radar_application_consents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Catálogo de estados de postulación (Épica 5 / HU4).
INSERT INTO "job_application_statuses" ("id", "title", "updated_at") VALUES
    ('5a000000-0000-4000-8000-000000000001', 'En revisión', CURRENT_TIMESTAMP),
    ('5a000000-0000-4000-8000-000000000002', 'Entrevista', CURRENT_TIMESTAMP),
    ('5a000000-0000-4000-8000-000000000003', 'Aceptada', CURRENT_TIMESTAMP),
    ('5a000000-0000-4000-8000-000000000004', 'No seleccionado', CURRENT_TIMESTAMP),
    ('5a000000-0000-4000-8000-000000000005', 'Retirada', CURRENT_TIMESTAMP)
ON CONFLICT ("title") DO NOTHING;

-- Catálogo de áreas del radar (HU1/HU3/HU4).
INSERT INTO "radar_areas" ("id", "name", "description", "updated_at") VALUES
    ('desarrollo', 'Desarrollo de Software', 'Frontend, backend, mobile y arquitectura de software', CURRENT_TIMESTAMP),
    ('cloud-devops', 'Cloud & DevOps', 'Infraestructura en la nube, CI/CD, contenedores y automatización', CURRENT_TIMESTAMP),
    ('data-ai', 'Datos & IA', 'Bases de datos, analítica, pipelines de datos e inteligencia artificial', CURRENT_TIMESTAMP),
    ('qa', 'QA & Testing', 'Aseguramiento de la calidad, pruebas automatizadas y manuales', CURRENT_TIMESTAMP),
    ('ciberseguridad', 'Ciberseguridad', 'Seguridad informática, pentesting, auditoría y protección de datos', CURRENT_TIMESTAMP),
    ('gobernanza-ti', 'Gobernanza TI', 'Gestión de proyectos, metodologías ágiles, ITIL y liderazgo técnico', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
