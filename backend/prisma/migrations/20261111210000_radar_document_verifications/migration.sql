BEGIN;
-- A version is enqueued in the same transaction as its original file.
CREATE TABLE radar_document_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('cv','certification')),
  source_id uuid NOT NULL, filename text NOT NULL, mime text NOT NULL,
  content bytea, size_bytes integer NOT NULL, active boolean NOT NULL DEFAULT true,
  digest text NOT NULL, status text NOT NULL DEFAULT 'queued',
  confidence double precision, reason text NOT NULL DEFAULT '', skills jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), decided_at timestamptz,
  reviewer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  notice_read boolean NOT NULL DEFAULT false,
  published_ids jsonb NOT NULL DEFAULT '[]', radar_version integer,
  synced boolean NOT NULL DEFAULT false, lease uuid, retry_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX radar_doc_owner_date ON radar_document_verifications(user_id, created_at DESC);
CREATE INDEX radar_doc_work ON radar_document_verifications(retry_at) WHERE active AND NOT synced;
CREATE UNIQUE INDEX radar_doc_active_version ON radar_document_verifications(source_type,source_id) WHERE active;
ALTER TABLE user_skills ADD COLUMN radar_auto_verified boolean NOT NULL DEFAULT false;

CREATE FUNCTION radar_capture_cv() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE bytes bytea;
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE radar_document_verifications SET active=false, content=NULL
    WHERE source_type='cv' AND source_id=OLD.id;
    RETURN OLD;
  END IF;
  IF NEW.cv_pdf_data IS NOT NULL THEN
    bytes := decode(NEW.cv_pdf_data,'base64');
    INSERT INTO radar_document_verifications(user_id,source_type,source_id,filename,mime,content,size_bytes,digest)
    VALUES(NEW.user_id,'cv',NEW.id,COALESCE(NEW.cv_file_name,'Currículum.pdf'),'application/pdf',bytes,octet_length(bytes),encode(sha256(bytes),'hex'));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER radar_cv_version AFTER INSERT OR DELETE ON user_cv_file FOR EACH ROW EXECUTE FUNCTION radar_capture_cv();

CREATE FUNCTION radar_capture_certificate() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE bytes bytea;
BEGIN
  IF NEW.event_type <> 'certification.document_metadata' THEN RETURN NEW; END IF;
  UPDATE radar_document_verifications SET active=false WHERE source_type='certification' AND source_id=NEW.target_id AND active;
  IF NEW.details->>'removed' = 'true' THEN
    UPDATE radar_document_verifications SET content=NULL WHERE source_type='certification' AND source_id=NEW.target_id;
  ELSE
    SELECT document_url INTO bytes FROM certifications WHERE id=NEW.target_id AND user_id=NEW.user_id;
    IF bytes IS NOT NULL THEN
      INSERT INTO radar_document_verifications(user_id,source_type,source_id,filename,mime,content,size_bytes,digest)
      VALUES(NEW.user_id,'certification',NEW.target_id,NEW.details->>'documentFileName',NEW.details->>'documentMimeType',
        bytes,octet_length(bytes),encode(sha256(bytes),'hex'));
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER radar_cert_version AFTER INSERT ON radar_audit_events FOR EACH ROW
WHEN (NEW.event_type='certification.document_metadata') EXECUTE FUNCTION radar_capture_certificate();

CREATE FUNCTION radar_remove_certificate_versions() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE radar_document_verifications SET active=false, content=NULL WHERE source_type='certification' AND source_id=OLD.id;
  RETURN OLD;
END $$;
CREATE TRIGGER radar_cert_deleted AFTER DELETE ON certifications FOR EACH ROW EXECUTE FUNCTION radar_remove_certificate_versions();

-- The established publication service reads the review and extraction catalogs.
CREATE FUNCTION radar_apply_cv_verification() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT NEW.active OR NEW.source_type <> 'cv' OR NEW.status IN ('queued','reading') THEN RETURN NEW; END IF;
  INSERT INTO radar_cv_evidence(cv_id,user_id,submitted_at,extracted_text,extraction_status_id,review_status_id,reviewer_id,decided_at)
    SELECT NEW.source_id,NEW.user_id,NEW.created_at,COALESCE((SELECT string_agg(skill->>'name', E'\n') FROM jsonb_array_elements(NEW.skills) skill),''),
      ex.id,rs.id,NEW.reviewer_id,NEW.decided_at FROM radar_cv_extraction_statuses ex CROSS JOIN radar_cv_review_statuses rs
      WHERE ex.title=CASE WHEN jsonb_array_length(NEW.skills)>0 THEN 'ready' ELSE 'unreadable' END
        AND rs.title=CASE WHEN NEW.status IN ('approved','manual_approved') THEN 'approved'
          WHEN NEW.status IN ('low_confidence','manual_rejected') THEN 'rejected' ELSE 'pending' END
    ON CONFLICT(cv_id) DO UPDATE SET extracted_text=excluded.extracted_text,extraction_status_id=excluded.extraction_status_id,
      review_status_id=excluded.review_status_id,reviewer_id=excluded.reviewer_id,decided_at=excluded.decided_at,updated_at=clock_timestamp();
  RETURN NEW;
END $$;
CREATE TRIGGER radar_cv_result AFTER UPDATE OF status ON radar_document_verifications FOR EACH ROW
WHEN (NEW.status IS DISTINCT FROM OLD.status) EXECUTE FUNCTION radar_apply_cv_verification();

-- Keep existing decisions and expose previously uploaded files without reclassifying them.
INSERT INTO radar_document_verifications(user_id,source_type,source_id,filename,mime,content,size_bytes,digest,status,created_at,reason,synced)
SELECT user_id,'cv',id,coalesce(cv_file_name,'Currículum.pdf'),'application/pdf',bytes,octet_length(bytes),encode(sha256(bytes),'hex'),
  'legacy',coalesce(cv_uploaded_at,created_at),'Documento registrado antes de la verificación automática.',true
FROM user_cv_file CROSS JOIN LATERAL (SELECT decode(cv_pdf_data,'base64') AS bytes) f WHERE cv_pdf_data IS NOT NULL;

INSERT INTO radar_document_verifications(user_id,source_type,source_id,filename,mime,content,size_bytes,digest,status,created_at,reason,synced)
SELECT c.user_id,'certification',c.id,coalesce(a.details->>'documentFileName',c.name),
  coalesce(a.details->>'documentMimeType', CASE WHEN substring(c.document_url FROM 1 FOR 4)=decode('89504e47','hex') THEN 'image/png'
    WHEN substring(c.document_url FROM 1 FOR 2)=decode('ffd8','hex') THEN 'image/jpeg' ELSE 'application/pdf' END),
  c.document_url,octet_length(c.document_url),encode(sha256(c.document_url),'hex'),'legacy',c.updated_at,
  'Certificación registrada antes de la verificación automática.',true
FROM certifications c LEFT JOIN LATERAL (SELECT details FROM radar_audit_events WHERE user_id=c.user_id AND target_id=c.id
 AND event_type='certification.document_metadata' ORDER BY occurred_at DESC,id DESC LIMIT 1) a ON true WHERE c.document_url IS NOT NULL;

CREATE FUNCTION radar_audit_verification() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO radar_audit_events(user_id,actor_id,event_type,target_id,details,occurred_at)
    VALUES(NEW.user_id,NEW.reviewer_id,'document.verification',NEW.id,jsonb_build_object(
      'sourceId',NEW.source_id,'sourceType',NEW.source_type,'status',NEW.status,'confidence',NEW.confidence,'reason',NEW.reason,'skills',NEW.skills),NEW.decided_at);
  RETURN NEW;
END $$;
CREATE TRIGGER radar_doc_decision_audit AFTER UPDATE OF status ON radar_document_verifications
FOR EACH ROW WHEN (NEW.decided_at IS NOT NULL AND NEW.status IS DISTINCT FROM OLD.status) EXECUTE FUNCTION radar_audit_verification();

CREATE FUNCTION radar_cancel_inactive_verification() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IN ('queued','reading') THEN
    NEW.status := 'cancelled';
    NEW.reason := 'La versión se retiró antes de finalizar el análisis.';
    NEW.lease := NULL;
    NEW.synced := true;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER radar_doc_cancel_inactive BEFORE UPDATE OF active ON radar_document_verifications
FOR EACH ROW WHEN (OLD.active AND NOT NEW.active) EXECUTE FUNCTION radar_cancel_inactive_verification();
COMMIT;
