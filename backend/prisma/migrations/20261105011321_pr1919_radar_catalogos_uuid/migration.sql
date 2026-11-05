/*
  Warnings:

  - The primary key for the `radar_cv_evidence` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `radar_score_snapshots` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[cv_id]` on the table `radar_cv_evidence` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,version]` on the table `radar_score_snapshots` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN;

-- DropForeignKey
ALTER TABLE "radar_audit_events" DROP CONSTRAINT "radar_audit_events_actor_id_fkey";

-- DropForeignKey
ALTER TABLE "radar_cv_evidence" DROP CONSTRAINT "radar_cv_evidence_reviewer_id_fkey";

-- AlterTable
ALTER TABLE "radar_cv_evidence" DROP CONSTRAINT "radar_cv_evidence_pkey",
ADD COLUMN     "extraction_status_id" UUID,
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "review_status_id" UUID,
ADD CONSTRAINT "radar_cv_evidence_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "radar_score_snapshots" DROP CONSTRAINT "radar_score_snapshots_pkey",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "radar_score_snapshots_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "radar_cv_extraction_statuses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(24) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "radar_cv_extraction_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radar_cv_review_statuses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(24) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "radar_cv_review_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "radar_cv_extraction_statuses_title_key" ON "radar_cv_extraction_statuses"("title");

-- CreateIndex
CREATE UNIQUE INDEX "radar_cv_review_statuses_title_key" ON "radar_cv_review_statuses"("title");

-- Inicializacion de catalogos de estados
INSERT INTO "radar_cv_extraction_statuses" ("title")
VALUES ('pending'), ('ready'), ('error'), ('unreadable')
ON CONFLICT ("title") DO NOTHING;

INSERT INTO "radar_cv_review_statuses" ("title")
VALUES ('pending'), ('approved'), ('rejected'), ('revoked')
ON CONFLICT ("title") DO NOTHING;



-- CreateIndex
CREATE INDEX "radar_audit_subject_idx" ON "radar_audit_events"("user_id");

-- CreateIndex
CREATE INDEX "radar_audit_actor_idx" ON "radar_audit_events"("actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "radar_cv_evidence_cv_id_key" ON "radar_cv_evidence"("cv_id");

-- CreateIndex
CREATE INDEX "radar_cv_evidence_user_idx" ON "radar_cv_evidence"("user_id");

-- CreateIndex
CREATE INDEX "radar_cv_evidence_reviewer_idx" ON "radar_cv_evidence"("reviewer_id");

-- CreateIndex
CREATE INDEX "radar_cv_evidence_extraction_status_idx" ON "radar_cv_evidence"("extraction_status_id");

-- CreateIndex
CREATE INDEX "radar_cv_evidence_review_status_idx" ON "radar_cv_evidence"("review_status_id");

-- CreateIndex
CREATE INDEX "radar_score_snapshots_user_idx" ON "radar_score_snapshots"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "radar_score_snapshots_user_version_key" ON "radar_score_snapshots"("user_id", "version");

-- AddForeignKey
ALTER TABLE "radar_cv_evidence" ADD CONSTRAINT "radar_cv_evidence_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radar_cv_evidence" ADD CONSTRAINT "radar_cv_evidence_extraction_status_id_fkey" FOREIGN KEY ("extraction_status_id") REFERENCES "radar_cv_extraction_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radar_cv_evidence" ADD CONSTRAINT "radar_cv_evidence_review_status_id_fkey" FOREIGN KEY ("review_status_id") REFERENCES "radar_cv_review_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radar_audit_events" ADD CONSTRAINT "radar_audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- Vinculacion y validacion de los estados existentes
UPDATE "radar_cv_evidence" AS e
SET "extraction_status_id" = c."id"
FROM "radar_cv_extraction_statuses" AS c
WHERE c."title" = e."extraction_status";

UPDATE "radar_cv_evidence" AS e
SET "review_status_id" = c."id"
FROM "radar_cv_review_statuses" AS c
WHERE c."title" = e."review_status";

DO $pr1919$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "radar_cv_evidence" AS e
    LEFT JOIN "radar_cv_extraction_statuses" AS x ON x."id" = e."extraction_status_id"
    LEFT JOIN "radar_cv_review_statuses" AS r ON r."id" = e."review_status_id"
    WHERE x."title" IS DISTINCT FROM e."extraction_status"
       OR r."title" IS DISTINCT FROM e."review_status"
  ) THEN
    RAISE EXCEPTION 'No se pudieron vincular todos los estados de CV; se cancela la migracion';
  END IF;
END
$pr1919$;

COMMIT;

