-- AlterTable
ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "closing_soon_notified_at" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "closed_notified_at" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "last_reminder_sent_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE IF NOT EXISTS "survey_alert_configs" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "threshold" INTEGER NOT NULL DEFAULT 10,
    "question_ids" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "survey_alert_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "survey_alert_configs_survey_id_key" ON "survey_alert_configs"("survey_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'survey_alert_configs_survey_id_fkey'
    ) THEN
        ALTER TABLE "survey_alert_configs" ADD CONSTRAINT "survey_alert_configs_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
