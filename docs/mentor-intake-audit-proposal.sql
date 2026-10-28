-- PROPUESTA PARA DATABASE. No es una migración ejecutable del repositorio.
-- No se aplicó. Requiere revisión, autorización y nuevo nombre de migración.
-- Conserva UUID, estados, catálogos, claves, fechas de negocio y datos existentes.
-- Ejecutar únicamente después de la compatibilidad 20261028010000.
BEGIN;

ALTER TABLE mentor_intake_attempts
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6);
UPDATE mentor_intake_attempts SET created_at = occurred_at WHERE created_at IS NULL;
UPDATE mentor_intake_attempts SET updated_at = created_at WHERE updated_at IS NULL;
ALTER TABLE mentor_intake_attempts
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE mentor_participation_sanctions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6);
UPDATE mentor_participation_sanctions SET created_at = started_at WHERE created_at IS NULL;
UPDATE mentor_participation_sanctions SET updated_at = created_at WHERE updated_at IS NULL;
ALTER TABLE mentor_participation_sanctions
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE mentor_mail_outbox ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6);
UPDATE mentor_mail_outbox SET updated_at = created_at WHERE updated_at IS NULL;
ALTER TABLE mentor_mail_outbox
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS mentor_intake_attempts_user_id_idx ON mentor_intake_attempts(user_id);
CREATE INDEX IF NOT EXISTS mentor_mail_outbox_user_id_idx ON mentor_mail_outbox(user_id);

-- Los defaults admiten inserts SQL y el trigger cubre updates fuera de Prisma.
CREATE FUNCTION touch_mentor_intake_audit() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END $$;
DO $$
DECLARE table_name TEXT; trigger_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['mentor_intake_attempts', 'mentor_participation_sanctions', 'mentor_mail_outbox'] LOOP
    trigger_name := table_name || '_touch_updated_at';
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgrelid = to_regclass(table_name)
        AND tgname = trigger_name AND NOT tgisinternal
    ) THEN
      EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_mentor_intake_audit()', trigger_name, table_name);
    END IF;
  END LOOP;
END $$;

-- La relación opcional es trazabilidad. Confirmar esta decisión con Database.
ALTER TABLE mentor_participation_sanctions
  DROP CONSTRAINT mentor_participation_sanctions_trigger_attempt_id_fkey;
ALTER TABLE mentor_participation_sanctions
  ADD CONSTRAINT mentor_participation_sanctions_trigger_attempt_id_fkey
  FOREIGN KEY (trigger_attempt_id) REFERENCES mentor_intake_attempts(id)
  ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT;

-- Cambios Prisma correspondientes, a cargo de Database:
-- createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
-- updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
-- @@index([userId]) en intentos y outbox; onDelete: SetNull en triggerAttempt.
-- No cambiar dbgenerated("gen_random_uuid()") sin resolver todos los inserts SQL.
-- La normalización de catálogos requiere otra revisión coordinada; no borrar texto.
