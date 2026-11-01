INSERT INTO "survey_question_types" ("id", "title", "description", "updated_at") VALUES
    (gen_random_uuid(), 'dropdown', 'Lista desplegable', CURRENT_TIMESTAMP)
ON CONFLICT ("title") DO NOTHING;
