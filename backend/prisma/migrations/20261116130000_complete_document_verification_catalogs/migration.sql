BEGIN;

CREATE TABLE radar_document_statuses (
  code text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO radar_document_statuses(code,name) VALUES
  ('queued','En cola'), ('reading','En proceso'),
  ('approved','Aprobado automáticamente'), ('review','En revisión administrativa'),
  ('low_confidence','Rechazado por baja confianza'),
  ('manual_approved','Aprobado por administración'), ('manual_rejected','Rechazado por administración'),
  ('cancelled','Cancelado'), ('legacy','Anterior a la verificación automática');

CREATE TABLE radar_document_source_types (
  code text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO radar_document_source_types(code,name) VALUES ('cv','Currículum'), ('certification','Certificación');

ALTER TABLE radar_document_verifications
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  ADD CONSTRAINT radar_document_status_fk FOREIGN KEY(status) REFERENCES radar_document_statuses(code),
  ADD CONSTRAINT radar_document_source_type_fk FOREIGN KEY(source_type) REFERENCES radar_document_source_types(code);
UPDATE radar_document_verifications SET updated_at=COALESCE(decided_at,created_at);
CREATE INDEX radar_document_reviewer_idx ON radar_document_verifications(reviewer_id);

CREATE FUNCTION radar_document_touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END $$;

CREATE TRIGGER radar_document_updated BEFORE UPDATE ON radar_document_verifications
  FOR EACH ROW EXECUTE FUNCTION radar_document_touch_updated_at();
CREATE TRIGGER radar_document_status_updated BEFORE UPDATE ON radar_document_statuses
  FOR EACH ROW EXECUTE FUNCTION radar_document_touch_updated_at();
CREATE TRIGGER radar_document_source_updated BEFORE UPDATE ON radar_document_source_types
  FOR EACH ROW EXECUTE FUNCTION radar_document_touch_updated_at();

COMMIT;
