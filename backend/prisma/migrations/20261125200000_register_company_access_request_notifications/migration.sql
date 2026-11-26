INSERT INTO "notification_types" (
    "id", "code", "name", "sends_push", "sends_email", "updated_at"
)
VALUES
    (
        gen_random_uuid(), 'COMPANY_ACCESS_REQUEST_APPROVED',
        'Solicitud de empresa aprobada', false, true, CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(), 'COMPANY_ACCESS_REQUEST_OBSERVED',
        'Observaciones en solicitud de empresa', false, true, CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(), 'COMPANY_ACCESS_REQUEST_REJECTED',
        'Solicitud de empresa rechazada', false, true, CURRENT_TIMESTAMP
    )
ON CONFLICT ("code") DO NOTHING;
