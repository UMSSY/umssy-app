INSERT INTO "notification_types" (
    "id", "code", "name", "sends_push", "sends_email", "updated_at"
)
VALUES (
    gen_random_uuid(), 'JOB_OFFER_PUBLISHED', 'Nueva vacante publicada',
    true, false, CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO NOTHING;
