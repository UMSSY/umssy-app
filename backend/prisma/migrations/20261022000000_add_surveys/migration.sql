CREATE TYPE "SurveyStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TYPE "SurveyQuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE');

CREATE TABLE "surveys" (
    "id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" VARCHAR(500),
    "career_id" UUID,
    "academic_period" VARCHAR(7),
    "opens_at" TIMESTAMPTZ(6),
    "closes_at" TIMESTAMPTZ(6),
    "status" "SurveyStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "survey_questions" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "statement" VARCHAR(250) NOT NULL,
    "type" "SurveyQuestionType" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "survey_question_options" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "survey_question_options_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "surveys_career_id_academic_period_idx" ON "surveys"("career_id", "academic_period");

CREATE INDEX "surveys_created_by_id_idx" ON "surveys"("created_by_id");

CREATE INDEX "surveys_status_idx" ON "surveys"("status");

CREATE UNIQUE INDEX "survey_questions_survey_id_position_key" ON "survey_questions"("survey_id", "position");

CREATE UNIQUE INDEX "survey_question_options_question_id_position_key" ON "survey_question_options"("question_id", "position");

ALTER TABLE "surveys" ADD CONSTRAINT "surveys_career_id_fkey" FOREIGN KEY ("career_id") REFERENCES "careers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "survey_question_options" ADD CONSTRAINT "survey_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
