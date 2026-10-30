BEGIN;

CREATE FUNCTION mentor_sync_intake_catalog() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE doc JSONB; olddoc JSONB; label TEXT; catalog_id UUID; id_label TEXT;
BEGIN
  doc := to_jsonb(NEW);
  catalog_id := (doc->>TG_ARGV[1])::uuid;
  IF catalog_id IS NOT NULL THEN
    EXECUTE format('SELECT title::text FROM %I WHERE id = $1', TG_ARGV[2]) INTO id_label USING catalog_id;
    IF id_label IS NULL THEN RAISE EXCEPTION 'Identificador de catálogo inválido' USING ERRCODE = '23503'; END IF;
  END IF;
  IF TG_OP = 'UPDATE' THEN olddoc := to_jsonb(OLD); END IF;
  IF (TG_OP = 'UPDATE' AND doc->TG_ARGV[0] IS DISTINCT FROM olddoc->TG_ARGV[0])
    OR (TG_OP = 'INSERT' AND doc->>TG_ARGV[0] IS NOT NULL
      AND (id_label IS NULL OR id_label = TG_ARGV[3] OR doc->>TG_ARGV[0] <> TG_ARGV[3])) THEN
    label := doc->>TG_ARGV[0];
    EXECUTE format('SELECT id FROM %I WHERE title = $1', TG_ARGV[2]) INTO catalog_id USING label;
    IF catalog_id IS NULL THEN RAISE EXCEPTION 'Valor de catálogo inválido' USING ERRCODE = '23503'; END IF;
    doc := jsonb_set(doc, ARRAY[TG_ARGV[1]], to_jsonb(catalog_id));
  ELSE
    IF id_label IS NULL THEN RAISE EXCEPTION 'Catálogo obligatorio' USING ERRCODE = '23502'; END IF;
    doc := jsonb_set(doc, ARRAY[TG_ARGV[0]], to_jsonb(id_label));
  END IF;
  NEW := jsonb_populate_record(NEW, doc);
  RETURN NEW;
END $$;

CREATE TABLE IF NOT EXISTS mentor_intake_operations (
  id UUID PRIMARY KEY,
  title VARCHAR(30) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO mentor_intake_operations (id, title) VALUES
  ('07070000-0000-4000-8004-000000000001', 'ACTIVATE'),
  ('07070000-0000-4000-8004-000000000002', 'REQUEST'),
  ('07070000-0000-4000-8004-000000000003', 'LEGACY')
ON CONFLICT (title) DO NOTHING;
CREATE OR REPLACE FUNCTION mentor_intake_operation(value TEXT) RETURNS UUID LANGUAGE SQL STABLE STRICT AS
  $$ SELECT id FROM mentor_intake_operations WHERE title = value $$;
ALTER TABLE mentor_intake_attempts ADD COLUMN IF NOT EXISTS operation_id UUID;
UPDATE mentor_intake_attempts t SET operation_id = c.id FROM mentor_intake_operations c WHERE t.operation = c.title;
ALTER TABLE mentor_intake_attempts ALTER COLUMN operation_id SET NOT NULL;
ALTER TABLE mentor_intake_attempts ALTER COLUMN operation_id SET DEFAULT mentor_intake_operation('LEGACY');
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'mentor_intake_attempts'::regclass AND conname = 'mentor_intake_attempts_operation_id_fkey') THEN
    ALTER TABLE mentor_intake_attempts ADD CONSTRAINT mentor_intake_attempts_operation_id_fkey
      FOREIGN KEY (operation_id) REFERENCES mentor_intake_operations(id) ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS mentor_intake_attempts_operation_id_idx ON mentor_intake_attempts(operation_id);
DROP TRIGGER IF EXISTS mentor_intake_attempts_operation_compat ON mentor_intake_attempts;
CREATE TRIGGER mentor_intake_attempts_operation_compat BEFORE INSERT OR UPDATE ON mentor_intake_attempts
  FOR EACH ROW EXECUTE FUNCTION mentor_sync_intake_catalog('operation', 'operation_id', 'mentor_intake_operations', 'LEGACY');

CREATE TABLE IF NOT EXISTS mentor_mail_kinds (
  id UUID PRIMARY KEY,
  title VARCHAR(30) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO mentor_mail_kinds (id, title) VALUES
  ('07070000-0000-4000-8005-000000000001', 'OFFER'),
  ('07070000-0000-4000-8005-000000000002', 'SANCTION')
ON CONFLICT (title) DO NOTHING;
CREATE OR REPLACE FUNCTION mentor_mail_kind(value TEXT) RETURNS UUID LANGUAGE SQL STABLE STRICT AS
  $$ SELECT id FROM mentor_mail_kinds WHERE title = value $$;
ALTER TABLE mentor_mail_outbox ADD COLUMN IF NOT EXISTS kind_id UUID;
UPDATE mentor_mail_outbox t SET kind_id = c.id FROM mentor_mail_kinds c WHERE t.kind = c.title;
ALTER TABLE mentor_mail_outbox ALTER COLUMN kind_id SET NOT NULL;
ALTER TABLE mentor_mail_outbox ALTER COLUMN kind_id SET DEFAULT mentor_mail_kind('OFFER');
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'mentor_mail_outbox'::regclass AND conname = 'mentor_mail_outbox_kind_id_fkey') THEN
    ALTER TABLE mentor_mail_outbox ADD CONSTRAINT mentor_mail_outbox_kind_id_fkey
      FOREIGN KEY (kind_id) REFERENCES mentor_mail_kinds(id) ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS mentor_mail_outbox_kind_id_idx ON mentor_mail_outbox(kind_id);
DROP TRIGGER IF EXISTS mentor_mail_outbox_kind_compat ON mentor_mail_outbox;
CREATE TRIGGER mentor_mail_outbox_kind_compat BEFORE INSERT OR UPDATE ON mentor_mail_outbox
  FOR EACH ROW EXECUTE FUNCTION mentor_sync_intake_catalog('kind', 'kind_id', 'mentor_mail_kinds', 'OFFER');

CREATE TABLE IF NOT EXISTS mentor_mail_statuses (
  id UUID PRIMARY KEY,
  title VARCHAR(30) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO mentor_mail_statuses (id, title) VALUES
  ('07070000-0000-4000-8003-000000000001', 'PENDING'),
  ('07070000-0000-4000-8003-000000000002', 'SENDING'),
  ('07070000-0000-4000-8003-000000000003', 'SENT'),
  ('07070000-0000-4000-8003-000000000004', 'UNCERTAIN'),
  ('07070000-0000-4000-8003-000000000005', 'SUPERSEDED')
ON CONFLICT (title) DO NOTHING;
CREATE OR REPLACE FUNCTION mentor_mail_status(value TEXT) RETURNS UUID LANGUAGE SQL STABLE STRICT AS
  $$ SELECT id FROM mentor_mail_statuses WHERE title = value $$;
ALTER TABLE mentor_mail_outbox ADD COLUMN IF NOT EXISTS status_id UUID;
UPDATE mentor_mail_outbox t SET status_id = c.id FROM mentor_mail_statuses c WHERE t.status = c.title;
ALTER TABLE mentor_mail_outbox ALTER COLUMN status_id SET NOT NULL;
ALTER TABLE mentor_mail_outbox ALTER COLUMN status_id SET DEFAULT mentor_mail_status('PENDING');
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'mentor_mail_outbox'::regclass AND conname = 'mentor_mail_outbox_status_id_fkey') THEN
    ALTER TABLE mentor_mail_outbox ADD CONSTRAINT mentor_mail_outbox_status_id_fkey
      FOREIGN KEY (status_id) REFERENCES mentor_mail_statuses(id) ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS mentor_mail_outbox_status_id_idx ON mentor_mail_outbox(status_id);
DROP TRIGGER IF EXISTS mentor_mail_outbox_status_compat ON mentor_mail_outbox;
CREATE TRIGGER mentor_mail_outbox_status_compat BEFORE INSERT OR UPDATE ON mentor_mail_outbox
  FOR EACH ROW EXECUTE FUNCTION mentor_sync_intake_catalog('status', 'status_id', 'mentor_mail_statuses', 'PENDING');

ALTER TABLE mentor_mail_outbox ALTER COLUMN status SET DEFAULT 'PENDING';
ALTER TABLE mentor_intake_attempts DROP CONSTRAINT IF EXISTS mentor_intake_attempts_operation_check;
ALTER TABLE mentor_mail_outbox DROP CONSTRAINT IF EXISTS mentor_mail_outbox_kind_check;
ALTER TABLE mentor_mail_outbox DROP CONSTRAINT IF EXISTS mentor_mail_outbox_status_check;
CREATE INDEX IF NOT EXISTS mentor_mail_outbox_user_id_idx ON mentor_mail_outbox(user_id);

COMMIT;
