-- CreateTable
CREATE TABLE "survey_statuses" (
    "id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "survey_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_question_types" (
    "id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "survey_question_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "survey_statuses_title_key" ON "survey_statuses"("title");

-- CreateIndex
CREATE UNIQUE INDEX "survey_question_types_title_key" ON "survey_question_types"("title");

-- SeedCatalog
INSERT INTO "survey_statuses" ("id", "title", "updated_at") VALUES
    (gen_random_uuid(), 'draft', CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'published', CURRENT_TIMESTAMP);

-- SeedCatalog
INSERT INTO "survey_question_types" ("id", "title", "updated_at") VALUES
    (gen_random_uuid(), 'single_choice', CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'multiple_choice', CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "surveys" ADD COLUMN "status_id" UUID;

-- AlterTable
ALTER TABLE "survey_questions" ADD COLUMN "type_id" UUID;

-- MigrateData
UPDATE "surveys" AS "survey"
SET "status_id" = "status"."id"
FROM "survey_statuses" AS "status"
WHERE "status"."title" = LOWER("survey"."status"::TEXT);

-- MigrateData
UPDATE "survey_questions" AS "question"
SET "type_id" = "type"."id"
FROM "survey_question_types" AS "type"
WHERE "type"."title" = LOWER("question"."type"::TEXT);

-- AlterTable
ALTER TABLE "surveys" ALTER COLUMN "status_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "survey_questions" ALTER COLUMN "type_id" SET NOT NULL;

-- DropIndex
DROP INDEX "surveys_status_idx";

-- AlterTable
ALTER TABLE "surveys" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "survey_questions" DROP COLUMN "type";

-- DropEnum
DROP TYPE "SurveyStatus";

-- DropEnum
DROP TYPE "SurveyQuestionType";

-- CreateIndex
CREATE INDEX "surveys_status_id_idx" ON "surveys"("status_id");

-- CreateIndex
CREATE INDEX "survey_questions_type_id_idx" ON "survey_questions"("type_id");

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "survey_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "survey_question_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
