-- Las notificaciones de encuestas creadas antes de usar rutas relativas guardaron el
-- enlace como URL absoluta (FRONTEND_URL + ruta). El buzón solo acepta rutas internas,
-- por lo que esos avisos redirigían a la vista general en lugar de la encuesta.
UPDATE "notifications" AS n
SET "link" = regexp_replace(n."link", '^https?://[^/?#]+', ''),
    "updated_at" = NOW()
FROM "notification_types" AS t
WHERE n."type_id" = t."id"
  AND (
    (
      t."code" = 'SURVEY_PUBLISHED'
      AND n."link" ~ '^https?://[^/?#]+(/notifications\?filter=SURVEYS([&#].*)?|/surveys/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}([?#].*)?)$'
    )
    OR (
      t."code" = 'SURVEY_REMINDER'
      AND n."link" ~ '^https?://[^/?#]+/surveys/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}([?#].*)?$'
    )
    OR (
      t."code" IN ('SURVEY_CLOSING_SOON', 'SURVEY_CLOSED', 'SURVEY_VARIATION_ALERT')
      AND n."link" ~ '^https?://[^/?#]+/backoffice/surveys/statistics/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}([?#].*)?$'
    )
  );
