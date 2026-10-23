-- AlterEnum
BEGIN;
CREATE TYPE "SurveyStatus_new" AS ENUM ('DRAFT', 'PUBLISHED');
ALTER TABLE "public"."surveys" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "surveys" ALTER COLUMN "status" TYPE "SurveyStatus_new" USING ("status"::text::"SurveyStatus_new");
ALTER TYPE "SurveyStatus" RENAME TO "SurveyStatus_old";
ALTER TYPE "SurveyStatus_new" RENAME TO "SurveyStatus";
DROP TYPE "public"."SurveyStatus_old";
ALTER TABLE "surveys" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "survey_answers" DROP CONSTRAINT "survey_answers_option_id_fkey";

-- DropForeignKey
ALTER TABLE "survey_options" DROP CONSTRAINT "survey_options_question_id_fkey";

-- DropForeignKey
ALTER TABLE "surveys" DROP CONSTRAINT "surveys_career_id_fkey";

-- DropForeignKey
ALTER TABLE "surveys" DROP CONSTRAINT "surveys_creator_id_fkey";

-- DropIndex
DROP INDEX "surveys_career_id_idx";

-- DropIndex
DROP INDEX "surveys_creator_id_idx";

-- AlterTable
ALTER TABLE "survey_questions" DROP COLUMN "title",
ADD COLUMN     "statement" VARCHAR(250) NOT NULL,
ALTER COLUMN "type" DROP DEFAULT,
ALTER COLUMN "position" DROP DEFAULT;

-- AlterTable
ALTER TABLE "surveys" DROP COLUMN "academic_term",
DROP COLUMN "creator_id",
DROP COLUMN "end_date",
DROP COLUMN "start_date",
ADD COLUMN     "academic_period" VARCHAR(7),
ADD COLUMN     "closes_at" TIMESTAMPTZ(6),
ADD COLUMN     "created_by_id" UUID NOT NULL,
ADD COLUMN     "opens_at" TIMESTAMPTZ(6),
ALTER COLUMN "title" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500);

-- DropTable
DROP TABLE "survey_options";

-- CreateTable
CREATE TABLE "survey_question_options" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "survey_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "survey_question_options_question_id_position_key" ON "survey_question_options"("question_id", "position");

-- CreateIndex
CREATE INDEX "surveys_career_id_academic_period_idx" ON "surveys"("career_id", "academic_period");

-- CreateIndex
CREATE INDEX "surveys_created_by_id_idx" ON "surveys"("created_by_id");

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_career_id_fkey" FOREIGN KEY ("career_id") REFERENCES "careers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_question_options" ADD CONSTRAINT "survey_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "survey_question_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
