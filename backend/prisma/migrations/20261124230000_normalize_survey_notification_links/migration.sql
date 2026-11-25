-- Las notificaciones de encuestas creadas antes de usar rutas relativas guardaron el
-- enlace como URL absoluta (FRONTEND_URL + ruta). El buzón solo acepta rutas internas,
-- por lo que esos avisos redirigían a la vista general en lugar de la encuesta.
-- Se conserva solo la ruta (con query y hash) para que apunten a la encuesta correcta.
UPDATE "notifications" AS n
SET "link" = regexp_replace(n."link", '^https?://[^/]+', '', 'i'),
    "updated_at" = NOW()
FROM "notification_types" AS t
WHERE n."type_id" = t."id"
  AND t."code" IN (
    'SURVEY_PUBLISHED',
    'SURVEY_REMINDER',
    'SURVEY_CLOSING_SOON',
    'SURVEY_CLOSED',
    'SURVEY_VARIATION_ALERT'
  )
  AND n."link" ~* '^https?://[^/]+/.+';
