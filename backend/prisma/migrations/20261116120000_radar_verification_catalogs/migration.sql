BEGIN;
CREATE TABLE radar_document_statuses (
  code text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz(6) NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz(6) NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO radar_document_statuses(code,name) VALUES
 ('queued','En cola'),('reading','En proceso'),('approved','Aprobado automáticamente'),
 ('review','En revisión administrativa'),('low_confidence','Lectura insuficiente'),
 ('manual_approved','Aprobado por administración'),('manual_rejected','Rechazado por administración'),
 ('legacy','Registro previo'),('cancelled','Cancelado');
CREATE TABLE radar_document_source_types (
  code text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz(6) NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz(6) NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO radar_document_source_types(code,name) VALUES ('cv','Currículum'),('certification','Certificación');
ALTER TABLE radar_document_verifications
 ADD COLUMN updated_at timestamptz(6),
 ADD CONSTRAINT radar_document_status_fk FOREIGN KEY(status) REFERENCES radar_document_statuses(code) ON UPDATE CASCADE ON DELETE RESTRICT,
 ADD CONSTRAINT radar_document_source_type_fk FOREIGN KEY(source_type) REFERENCES radar_document_source_types(code) ON UPDATE CASCADE ON DELETE RESTRICT;
UPDATE radar_document_verifications SET updated_at=COALESCE(decided_at,created_at);
ALTER TABLE radar_document_verifications ALTER COLUMN updated_at SET NOT NULL,
 ALTER COLUMN updated_at SET DEFAULT clock_timestamp();
CREATE INDEX radar_doc_reviewer ON radar_document_verifications(reviewer_id);
CREATE INDEX radar_doc_status ON radar_document_verifications(status);
CREATE INDEX radar_doc_source_type ON radar_document_verifications(source_type);
CREATE FUNCTION radar_touch_document_audit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 NEW.updated_at := clock_timestamp();
 RETURN NEW;
END $$;
CREATE TRIGGER radar_document_updated_at BEFORE UPDATE ON radar_document_verifications
 FOR EACH ROW EXECUTE FUNCTION radar_touch_document_audit();
CREATE TRIGGER radar_document_status_updated_at BEFORE UPDATE ON radar_document_statuses
 FOR EACH ROW EXECUTE FUNCTION radar_touch_document_audit();
CREATE TRIGGER radar_document_source_updated_at BEFORE UPDATE ON radar_document_source_types
 FOR EACH ROW EXECUTE FUNCTION radar_touch_document_audit();
COMMIT;
