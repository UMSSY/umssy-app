BEGIN;

-- Se conserva el estado utilizado por las consultas anteriores, incluso en registros sin FK.
INSERT INTO radar_cv_extraction_statuses (title)
SELECT DISTINCT extraction_status FROM radar_cv_evidence ON CONFLICT (title) DO NOTHING;
INSERT INTO radar_cv_review_statuses (title)
SELECT DISTINCT review_status FROM radar_cv_evidence ON CONFLICT (title) DO NOTHING;
UPDATE radar_cv_evidence e SET extraction_status_id=s.id
FROM radar_cv_extraction_statuses s WHERE s.title=e.extraction_status;
UPDATE radar_cv_evidence e SET review_status_id=s.id
FROM radar_cv_review_statuses s WHERE s.title=e.review_status;

ALTER TABLE radar_cv_evidence
  ALTER COLUMN extraction_status_id SET NOT NULL,
  ALTER COLUMN review_status_id SET NOT NULL,
  DROP CONSTRAINT radar_cv_evidence_extraction_status_id_fkey,
  DROP CONSTRAINT radar_cv_evidence_review_status_id_fkey,
  ADD CONSTRAINT radar_cv_evidence_extraction_status_id_fkey
    FOREIGN KEY (extraction_status_id) REFERENCES radar_cv_extraction_statuses(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT radar_cv_evidence_review_status_id_fkey
    FOREIGN KEY (review_status_id) REFERENCES radar_cv_review_statuses(id) ON DELETE RESTRICT ON UPDATE RESTRICT;

DROP INDEX radar_cv_evidence_review_idx;
ALTER TABLE radar_cv_evidence DROP COLUMN extraction_status, DROP COLUMN review_status;
CREATE INDEX radar_cv_evidence_review_idx ON radar_cv_evidence(review_status_id,submitted_at);

ALTER TABLE radar_cv_evidence ADD COLUMN created_at TIMESTAMPTZ(6), ADD COLUMN updated_at TIMESTAMPTZ(6);
UPDATE radar_cv_evidence SET created_at=submitted_at, updated_at=GREATEST(submitted_at,decided_at);
ALTER TABLE radar_audit_events ADD COLUMN created_at TIMESTAMPTZ(6), ADD COLUMN updated_at TIMESTAMPTZ(6);
UPDATE radar_audit_events SET created_at=occurred_at, updated_at=occurred_at;
ALTER TABLE radar_score_snapshots ADD COLUMN updated_at TIMESTAMPTZ(6);
UPDATE radar_score_snapshots SET updated_at=created_at;
ALTER TABLE radar_cv_evidence
  ALTER COLUMN created_at SET NOT NULL, ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET NOT NULL, ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE radar_audit_events
  ALTER COLUMN created_at SET NOT NULL, ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET NOT NULL, ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE radar_score_snapshots
  ALTER COLUMN updated_at SET NOT NULL, ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

COMMIT;
