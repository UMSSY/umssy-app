ALTER TABLE "events"
  ADD COLUMN "cover_data" BYTEA,
  ADD COLUMN "cover_mime_type" VARCHAR(30),
  ADD COLUMN "proposal_key" VARCHAR(36),
  ADD COLUMN "proposal_hash" VARCHAR(64);
CREATE UNIQUE INDEX "events_created_by_id_proposal_key_key" ON "events"("created_by_id", "proposal_key");

INSERT INTO "event_categories" ("id", "name", "created_at", "updated_at")
SELECT gen_random_uuid(), name, NOW(), NOW() FROM (VALUES
 ('Tecnología'), ('IA & Datos'), ('Diseño'), ('Seguridad'), ('Empleabilidad'), ('Investigación'), ('Emprendimiento')
) AS categories(name) ON CONFLICT ("name") DO NOTHING;
