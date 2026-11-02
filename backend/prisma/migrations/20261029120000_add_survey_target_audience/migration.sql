-- CreateTable
CREATE TABLE IF NOT EXISTS "survey_target_audiences" (
    "id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "survey_target_audiences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "survey_target_audiences_title_key" ON "survey_target_audiences"("title");

INSERT INTO "survey_target_audiences" ("id", "title", "description", "updated_at") VALUES
    (gen_random_uuid(), 'all', 'Todos los usuarios destinatarios', CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'graduates', 'Titulados', CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'students', 'Estudiantes', CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'mentors', 'Mentores', CURRENT_TIMESTAMP)
ON CONFLICT ("title") DO NOTHING;

-- AlterTable
ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "target_audience_id" UUID;
ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "targets_all_careers" BOOLEAN NOT NULL DEFAULT false;

-- Las encuestas existentes fueron creadas solo para titulados; las publicadas sin carrera ya eran globales.
UPDATE "surveys"
SET "target_audience_id" = (SELECT "id" FROM "survey_target_audiences" WHERE "title" = 'graduates')
WHERE "target_audience_id" IS NULL;

UPDATE "surveys" AS survey
SET "targets_all_careers" = true
FROM "survey_statuses" AS status
WHERE survey."status_id" = status."id"
  AND status."title" = 'published'
  AND survey."career_id" IS NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "surveys_target_audience_id_idx" ON "surveys"("target_audience_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"surveys"'::regclass AND conname = 'surveys_target_audience_id_fkey') THEN
        ALTER TABLE "surveys" ADD CONSTRAINT "surveys_target_audience_id_fkey" FOREIGN KEY ("target_audience_id") REFERENCES "survey_target_audiences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
