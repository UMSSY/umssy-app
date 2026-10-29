-- Estado para postulaciones retiradas por el postulante (HU-05)
INSERT INTO "job_application_statuses" ("id", "title", "updated_at") VALUES
    ('5a000000-0000-4000-8000-000000000005', 'Retirada', CURRENT_TIMESTAMP)
ON CONFLICT ("title") DO NOTHING;
