BEGIN;
DROP TRIGGER radar_cv_result ON radar_document_verifications;
DROP TRIGGER radar_doc_decision_audit ON radar_document_verifications;
DROP TRIGGER radar_doc_cancel_inactive ON radar_document_verifications;
ALTER TABLE radar_document_verifications DROP CONSTRAINT radar_document_status_fk, DROP CONSTRAINT radar_document_source_type_fk;
ALTER TABLE radar_document_statuses RENAME COLUMN code TO title;
ALTER TABLE radar_document_statuses RENAME COLUMN name TO description;
ALTER TABLE radar_document_statuses ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();
UPDATE radar_document_statuses SET id='a0000000-0000-4000-8000-000000000001' WHERE title='queued';
UPDATE radar_document_statuses SET id='a0000000-0000-4000-8000-000000000002' WHERE title='reading';
UPDATE radar_document_statuses SET id='a0000000-0000-4000-8000-000000000003' WHERE title='approved';
UPDATE radar_document_statuses SET id='a0000000-0000-4000-8000-000000000004' WHERE title='review';
UPDATE radar_document_statuses SET id='a0000000-0000-4000-8000-000000000005' WHERE title='low_confidence';
UPDATE radar_document_statuses SET id='a0000000-0000-4000-8000-000000000006' WHERE title='manual_approved';
UPDATE radar_document_statuses SET id='a0000000-0000-4000-8000-000000000007' WHERE title='manual_rejected';
UPDATE radar_document_statuses SET id='a0000000-0000-4000-8000-000000000008' WHERE title='legacy';
UPDATE radar_document_statuses SET id='a0000000-0000-4000-8000-000000000009' WHERE title='cancelled';
ALTER TABLE radar_document_statuses DROP CONSTRAINT radar_document_statuses_pkey;
ALTER TABLE radar_document_statuses ADD PRIMARY KEY(id), ADD CONSTRAINT radar_document_statuses_title_key UNIQUE(title);
ALTER TABLE radar_document_source_types RENAME COLUMN code TO title;
ALTER TABLE radar_document_source_types RENAME COLUMN name TO description;
ALTER TABLE radar_document_source_types ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();
UPDATE radar_document_source_types SET id='b0000000-0000-4000-8000-000000000001' WHERE title='cv';
UPDATE radar_document_source_types SET id='b0000000-0000-4000-8000-000000000002' WHERE title='certification';
ALTER TABLE radar_document_source_types DROP CONSTRAINT radar_document_source_types_pkey;
ALTER TABLE radar_document_source_types ADD PRIMARY KEY(id), ADD CONSTRAINT radar_document_source_types_title_key UNIQUE(title);
ALTER TABLE radar_document_verifications ADD COLUMN status_id uuid, ADD COLUMN source_type_id uuid;
UPDATE radar_document_verifications d SET status_id=s.id,source_type_id=t.id
 FROM radar_document_statuses s,radar_document_source_types t WHERE s.title=d.status AND t.title=d.source_type;
ALTER TABLE radar_document_verifications ALTER COLUMN status_id SET NOT NULL, ALTER COLUMN source_type_id SET NOT NULL,
 ALTER COLUMN status_id SET DEFAULT 'a0000000-0000-4000-8000-000000000001'::uuid;
ALTER TABLE radar_document_verifications DROP COLUMN status, DROP COLUMN source_type;
ALTER TABLE radar_document_verifications
 ADD CONSTRAINT radar_document_status_fk FOREIGN KEY(status_id) REFERENCES radar_document_statuses(id) ON UPDATE CASCADE ON DELETE RESTRICT,
 ADD CONSTRAINT radar_document_source_type_fk FOREIGN KEY(source_type_id) REFERENCES radar_document_source_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;
CREATE INDEX radar_doc_status ON radar_document_verifications(status_id);
CREATE INDEX radar_doc_source_type ON radar_document_verifications(source_type_id);
CREATE UNIQUE INDEX radar_doc_active_version ON radar_document_verifications(source_type_id,source_id) WHERE active;
CREATE OR REPLACE FUNCTION radar_capture_cv() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE bytes bytea;
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE radar_document_verifications SET active=false, content=NULL
    WHERE source_type_id=(SELECT id FROM radar_document_source_types WHERE title='cv') AND source_id=OLD.id;
    RETURN OLD;
  END IF;
  IF NEW.cv_pdf_data IS NOT NULL THEN
    bytes := decode(NEW.cv_pdf_data,'base64');
    INSERT INTO radar_document_verifications(user_id,source_type_id,source_id,filename,mime,content,size_bytes,digest)
    VALUES(NEW.user_id,(SELECT id FROM radar_document_source_types WHERE title='cv'),NEW.id,COALESCE(NEW.cv_file_name,'Currículum.pdf'),'application/pdf',bytes,octet_length(bytes),encode(sha256(bytes),'hex'));
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION radar_capture_certificate() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE bytes bytea;
BEGIN
  IF NEW.event_type <> 'certification.document_metadata' THEN RETURN NEW; END IF;
  UPDATE radar_document_verifications SET active=false WHERE source_type_id=(SELECT id FROM radar_document_source_types WHERE title='certification') AND source_id=NEW.target_id AND active;
  IF NEW.details->>'removed' = 'true' THEN
    UPDATE radar_document_verifications SET content=NULL WHERE source_type_id=(SELECT id FROM radar_document_source_types WHERE title='certification') AND source_id=NEW.target_id;
  ELSE
    SELECT document_url INTO bytes FROM certifications WHERE id=NEW.target_id AND user_id=NEW.user_id;
    IF bytes IS NOT NULL THEN
      INSERT INTO radar_document_verifications(user_id,source_type_id,source_id,filename,mime,content,size_bytes,digest)
      VALUES(NEW.user_id,(SELECT id FROM radar_document_source_types WHERE title='certification'),NEW.target_id,NEW.details->>'documentFileName',NEW.details->>'documentMimeType',
        bytes,octet_length(bytes),encode(sha256(bytes),'hex'));
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION radar_remove_certificate_versions() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE radar_document_verifications SET active=false, content=NULL WHERE source_type_id=(SELECT id FROM radar_document_source_types WHERE title='certification') AND source_id=OLD.id;
  RETURN OLD;
END $$;
CREATE OR REPLACE FUNCTION radar_apply_cv_verification() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT NEW.active OR (SELECT title FROM radar_document_source_types WHERE id=NEW.source_type_id) <> 'cv' OR (SELECT title FROM radar_document_statuses WHERE id=NEW.status_id) IN ('queued','reading') THEN RETURN NEW; END IF;
  INSERT INTO radar_cv_evidence(cv_id,user_id,submitted_at,extracted_text,extraction_status_id,review_status_id,reviewer_id,decided_at)
    SELECT NEW.source_id,NEW.user_id,NEW.created_at,COALESCE((SELECT string_agg(skill->>'name', E'\n') FROM jsonb_array_elements(NEW.skills) skill),''),
      ex.id,rs.id,NEW.reviewer_id,NEW.decided_at FROM radar_cv_extraction_statuses ex CROSS JOIN radar_cv_review_statuses rs
      WHERE ex.title=CASE WHEN jsonb_array_length(NEW.skills)>0 THEN 'ready' ELSE 'unreadable' END
        AND rs.title=CASE WHEN (SELECT title FROM radar_document_statuses WHERE id=NEW.status_id) IN ('approved','manual_approved') THEN 'approved'
          WHEN (SELECT title FROM radar_document_statuses WHERE id=NEW.status_id) IN ('low_confidence','manual_rejected') THEN 'rejected' ELSE 'pending' END
    ON CONFLICT(cv_id) DO UPDATE SET extracted_text=excluded.extracted_text,extraction_status_id=excluded.extraction_status_id,
      review_status_id=excluded.review_status_id,reviewer_id=excluded.reviewer_id,decided_at=excluded.decided_at,updated_at=clock_timestamp();
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION radar_audit_verification() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO radar_audit_events(user_id,actor_id,event_type,target_id,details,occurred_at)
    VALUES(NEW.user_id,NEW.reviewer_id,'document.verification',NEW.id,jsonb_build_object(
      'sourceId',NEW.source_id,'sourceType',(SELECT title FROM radar_document_source_types WHERE id=NEW.source_type_id),'status',(SELECT title FROM radar_document_statuses WHERE id=NEW.status_id),'confidence',NEW.confidence,'reason',NEW.reason,'skills',NEW.skills),NEW.decided_at);
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION radar_cancel_inactive_verification() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT title FROM radar_document_statuses WHERE id=OLD.status_id) IN ('queued','reading') THEN
    NEW.status_id := (SELECT id FROM radar_document_statuses WHERE title='cancelled');
    NEW.reason := 'La versión se retiró antes de finalizar el análisis.';
    NEW.lease := NULL;
    NEW.synced := true;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER radar_cv_result AFTER UPDATE OF status_id ON radar_document_verifications FOR EACH ROW
 WHEN (NEW.status_id IS DISTINCT FROM OLD.status_id) EXECUTE FUNCTION radar_apply_cv_verification();
CREATE TRIGGER radar_doc_decision_audit AFTER UPDATE OF status_id ON radar_document_verifications FOR EACH ROW
 WHEN (NEW.decided_at IS NOT NULL AND NEW.status_id IS DISTINCT FROM OLD.status_id) EXECUTE FUNCTION radar_audit_verification();
CREATE TRIGGER radar_doc_cancel_inactive BEFORE UPDATE OF active ON radar_document_verifications FOR EACH ROW
 WHEN (OLD.active AND NOT NEW.active) EXECUTE FUNCTION radar_cancel_inactive_verification();
COMMIT;
