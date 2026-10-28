BEGIN;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'surveys' AND column_name = 'creator_id') THEN
        ALTER TABLE "surveys" RENAME COLUMN "creator_id" TO "created_by_id";
        ALTER TABLE "surveys" RENAME COLUMN "academic_term" TO "academic_period";
        ALTER TABLE "surveys" RENAME COLUMN "start_date" TO "opens_at";
        ALTER TABLE "surveys" RENAME COLUMN "end_date" TO "closes_at";
        ALTER TABLE "surveys" RENAME CONSTRAINT "surveys_creator_id_fkey" TO "surveys_created_by_id_fkey";
        ALTER TABLE "surveys" ALTER COLUMN "academic_period" DROP NOT NULL,
            ALTER COLUMN "opens_at" DROP NOT NULL, ALTER COLUMN "closes_at" DROP NOT NULL;
        ALTER TABLE "surveys" DROP CONSTRAINT "surveys_career_id_fkey";
        DROP INDEX IF EXISTS "surveys_creator_id_idx";
        DROP INDEX IF EXISTS "surveys_career_id_idx";
        ALTER TABLE "survey_questions" RENAME COLUMN "title" TO "statement";
        ALTER TABLE "survey_questions" ALTER COLUMN "position" DROP DEFAULT;
        ALTER TABLE "survey_options" RENAME TO "survey_question_options";
        ALTER TABLE "survey_question_options" RENAME COLUMN "option_text" TO "label";
        ALTER TABLE "survey_question_options" ALTER COLUMN "position" DROP DEFAULT;
        ALTER TABLE "survey_question_options" RENAME CONSTRAINT "survey_options_pkey" TO "survey_question_options_pkey";
        ALTER TABLE "survey_question_options" RENAME CONSTRAINT "survey_options_question_id_fkey" TO "survey_question_options_question_id_fkey";
        ALTER INDEX "survey_options_question_id_position_key" RENAME TO "survey_question_options_question_id_position_key";
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "survey_statuses" (
    "id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "survey_statuses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "survey_question_types" (
    "id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "survey_question_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "surveys" (
    "id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" VARCHAR(500),
    "career_id" UUID,
    "academic_period" VARCHAR(7),
    "opens_at" TIMESTAMPTZ(6),
    "closes_at" TIMESTAMPTZ(6),
    "status_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "survey_questions" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "statement" VARCHAR(250) NOT NULL,
    "type_id" UUID NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "survey_question_options" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "survey_question_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "survey_responses" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "respondent_id" UUID NOT NULL,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "survey_answers" (
    "id" UUID NOT NULL,
    "response_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "option_id" UUID,
    "text_value" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "survey_statuses" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "survey_question_types" ADD COLUMN IF NOT EXISTS "description" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "survey_statuses_title_key" ON "survey_statuses"("title");
CREATE UNIQUE INDEX IF NOT EXISTS "survey_question_types_title_key" ON "survey_question_types"("title");
INSERT INTO "survey_statuses" ("id", "title", "description", "updated_at") VALUES
    (gen_random_uuid(), 'draft', 'Encuesta en borrador', CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'published', 'Encuesta publicada', CURRENT_TIMESTAMP)
ON CONFLICT ("title") DO NOTHING;
INSERT INTO "survey_question_types" ("id", "title", "description", "updated_at") VALUES
    (gen_random_uuid(), 'single_choice', 'Pregunta de selección única', CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'multiple_choice', 'Pregunta de selección múltiple', CURRENT_TIMESTAMP)
ON CONFLICT ("title") DO NOTHING;

ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "status_id" UUID;
ALTER TABLE "survey_questions" ADD COLUMN IF NOT EXISTS "type_id" UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'surveys' AND column_name = 'status') THEN
        UPDATE "surveys" AS survey SET "status_id" = status."id"
        FROM "survey_statuses" AS status
        WHERE status."title" = CASE LOWER(survey."status"::TEXT)
            WHEN 'draft' THEN 'draft'
            WHEN 'published' THEN 'published'
            WHEN 'active' THEN 'published'
            WHEN 'closed' THEN 'published'
        END;
        UPDATE "surveys" SET "closes_at" = LEAST(COALESCE("closes_at", CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
        WHERE LOWER("status"::TEXT) = 'closed';
        ALTER TABLE "surveys" ALTER COLUMN "status_id" SET NOT NULL;
        ALTER TABLE "surveys" DROP COLUMN "status";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'survey_questions' AND column_name = 'type') THEN
        UPDATE "survey_questions" AS question SET "type_id" = type."id"
        FROM "survey_question_types" AS type
        WHERE type."title" = LOWER(question."type"::TEXT);
        ALTER TABLE "survey_questions" ALTER COLUMN "type_id" SET NOT NULL;
        ALTER TABLE "survey_questions" DROP COLUMN "type";
    END IF;
END $$;
ALTER TABLE "surveys" ALTER COLUMN "status_id" SET NOT NULL,
    ALTER COLUMN "title" TYPE VARCHAR(150), ALTER COLUMN "description" TYPE VARCHAR(500),
    ALTER COLUMN "academic_period" TYPE VARCHAR(7);
ALTER TABLE "survey_questions" ALTER COLUMN "type_id" SET NOT NULL,
    ALTER COLUMN "statement" TYPE VARCHAR(250);
ALTER TABLE "survey_question_options" ALTER COLUMN "label" TYPE VARCHAR(100);

ALTER TABLE "survey_answers" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(6);
UPDATE "survey_answers" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "survey_answers" ALTER COLUMN "updated_at" SET NOT NULL;

DROP TYPE IF EXISTS "SurveyStatus";
DROP TYPE IF EXISTS "SurveyQuestionType";

CREATE INDEX IF NOT EXISTS "surveys_career_id_academic_period_idx" ON "surveys"("career_id", "academic_period");

CREATE INDEX IF NOT EXISTS "surveys_created_by_id_idx" ON "surveys"("created_by_id");

CREATE INDEX IF NOT EXISTS "surveys_status_id_idx" ON "surveys"("status_id");

CREATE INDEX IF NOT EXISTS "survey_questions_type_id_idx" ON "survey_questions"("type_id");

CREATE UNIQUE INDEX IF NOT EXISTS "survey_questions_survey_id_position_key" ON "survey_questions"("survey_id", "position");

CREATE UNIQUE INDEX IF NOT EXISTS "survey_question_options_question_id_position_key" ON "survey_question_options"("question_id", "position");

CREATE INDEX IF NOT EXISTS "survey_responses_respondent_id_idx" ON "survey_responses"("respondent_id");

CREATE UNIQUE INDEX IF NOT EXISTS "survey_responses_survey_id_respondent_id_key" ON "survey_responses"("survey_id", "respondent_id");

CREATE INDEX IF NOT EXISTS "survey_answers_response_id_idx" ON "survey_answers"("response_id");

CREATE INDEX IF NOT EXISTS "survey_answers_option_id_idx" ON "survey_answers"("option_id");

CREATE INDEX IF NOT EXISTS "survey_answers_question_id_option_id_idx" ON "survey_answers"("question_id", "option_id");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"surveys"'::regclass AND conname = 'surveys_career_id_fkey') THEN
        ALTER TABLE "surveys" ADD CONSTRAINT "surveys_career_id_fkey" FOREIGN KEY ("career_id") REFERENCES "careers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"surveys"'::regclass AND conname = 'surveys_status_id_fkey') THEN
        ALTER TABLE "surveys" ADD CONSTRAINT "surveys_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "survey_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"surveys"'::regclass AND conname = 'surveys_created_by_id_fkey') THEN
        ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"survey_questions"'::regclass AND conname = 'survey_questions_survey_id_fkey') THEN
        ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"survey_questions"'::regclass AND conname = 'survey_questions_type_id_fkey') THEN
        ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "survey_question_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"survey_question_options"'::regclass AND conname = 'survey_question_options_question_id_fkey') THEN
        ALTER TABLE "survey_question_options" ADD CONSTRAINT "survey_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"survey_responses"'::regclass AND conname = 'survey_responses_survey_id_fkey') THEN
        ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"survey_responses"'::regclass AND conname = 'survey_responses_respondent_id_fkey') THEN
        ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_respondent_id_fkey" FOREIGN KEY ("respondent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"survey_answers"'::regclass AND conname = 'survey_answers_response_id_fkey') THEN
        ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "survey_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"survey_answers"'::regclass AND conname = 'survey_answers_question_id_fkey') THEN
        ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"survey_answers"'::regclass AND conname = 'survey_answers_option_id_fkey') THEN
        ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "survey_question_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

COMMIT;
