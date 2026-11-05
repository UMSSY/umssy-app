-- Épica 3, Sprint 2. Tablas autónomas: no alterar ni eliminar datos de Épicas 2, 4 o 5.
CREATE TABLE IF NOT EXISTS radar_cv_evidence (
  cv_id UUID PRIMARY KEY REFERENCES user_cv_file(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  extracted_text TEXT NOT NULL DEFAULT '',
  extraction_status VARCHAR(24) NOT NULL DEFAULT 'pending',
  review_status VARCHAR(24) NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ,
  reviewer_id UUID REFERENCES users(id),
  CHECK (review_status IN ('pending','approved','rejected','revoked')),
  CHECK (extraction_status IN ('pending','ready','error','unreadable'))
);
CREATE INDEX IF NOT EXISTS radar_cv_evidence_review_idx ON radar_cv_evidence(review_status,submitted_at);
CREATE TABLE IF NOT EXISTS radar_score_snapshots (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  rubric_version VARCHAR(80) NOT NULL,
  fingerprint VARCHAR(64) NOT NULL,
  scores JSONB NOT NULL,
  evidence JSONB NOT NULL,
  average_score NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,version)
);
CREATE TABLE IF NOT EXISTS radar_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id),
  event_type VARCHAR(80) NOT NULL,
  target_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS radar_audit_user_idx ON radar_audit_events(user_id,occurred_at DESC);
CREATE TABLE IF NOT EXISTS radar_company_access (
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY(company_id,user_id)
);
CREATE TABLE IF NOT EXISTS radar_job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_offer_id UUID NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_to_recruiter BOOLEAN NOT NULL DEFAULT FALSE,
  consent_to_cv BOOLEAN NOT NULL DEFAULT FALSE,
  state VARCHAR(24) NOT NULL DEFAULT 'applied',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ,
  decided_by UUID REFERENCES users(id),
  UNIQUE(job_offer_id,user_id),
  CHECK (state IN ('applied','hired','rejected','withdrawn'))
);
CREATE INDEX IF NOT EXISTS radar_job_applications_vacancy_idx ON radar_job_applications(job_offer_id,applied_at DESC);
-- CV anteriores: visibles como pendientes de revisión, sin aprobarlos ni puntuarlos.
INSERT INTO radar_cv_evidence (cv_id,user_id,extraction_status,review_status,submitted_at)
SELECT id,user_id,'pending','pending',COALESCE(cv_uploaded_at,now())
FROM user_cv_file
ON CONFLICT (cv_id) DO NOTHING;
