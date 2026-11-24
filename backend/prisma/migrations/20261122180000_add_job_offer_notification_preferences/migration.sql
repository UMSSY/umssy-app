CREATE TABLE "job_alert_modes" (
    "id" UUID NOT NULL,
    "title" VARCHAR(30) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "job_alert_modes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "job_offer_notification_preferences" (
    "user_id" UUID NOT NULL,
    "mode_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "job_offer_notification_preferences_pkey" PRIMARY KEY ("user_id")
);

CREATE UNIQUE INDEX "job_alert_modes_title_key" ON "job_alert_modes"("title");

CREATE INDEX "job_offer_notification_preferences_mode_id_idx" ON "job_offer_notification_preferences"("mode_id");

ALTER TABLE "job_offer_notification_preferences" ADD CONSTRAINT "job_offer_notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "job_offer_notification_preferences" ADD CONSTRAINT "job_offer_notification_preferences_mode_id_fkey" FOREIGN KEY ("mode_id") REFERENCES "job_alert_modes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "job_alert_modes" ("id", "title", "description", "updated_at") VALUES
    ('7a1e0000-0000-4000-8000-000000000001', 'ALL', 'Todas las vacantes', CURRENT_TIMESTAMP),
    ('7a1e0000-0000-4000-8000-000000000002', 'MATCHING', 'Solo las que coinciden con mi perfil (afinidad mayor a 0 %)', CURRENT_TIMESTAMP),
    ('7a1e0000-0000-4000-8000-000000000003', 'HIGH_AFFINITY', 'Solo las de alta afinidad (desde 70 %)', CURRENT_TIMESTAMP)
ON CONFLICT ("title") DO NOTHING;
