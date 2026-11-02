-- Corrección Épica 3: una sola fuente de postulaciones, catálogos y trazabilidad.
-- Migración compatible con datos existentes. No modifica migraciones históricas.

-- Estados compartidos con Épica 5. Retirada es un estado terminal interno.
INSERT INTO job_application_statuses (id, title, created_at, updated_at)
VALUES (gen_random_uuid(), 'Retirada', now(), now())
ON CONFLICT (title) DO NOTHING;

-- Recuperar primero las postulaciones legacy que no estén ya en el dominio principal.
INSERT INTO job_applications (id, job_offer_id, user_id, status_id, applied_at, created_at, updated_at)
SELECT gen_random_uuid(), r.job_offer_id, r.user_id, st.id, r.applied_at, r.applied_at, now()
FROM radar_job_applications r
JOIN job_application_statuses st ON st.title = CASE r.state
  WHEN 'hired' THEN 'Aceptada'
  WHEN 'rejected' THEN 'No seleccionado'
  WHEN 'withdrawn' THEN 'Retirada'
  ELSE 'En revisión'
END
ON CONFLICT (job_offer_id,user_id) DO NOTHING;

-- La autorización de radar es opcional y pertenece a una postulación real.
CREATE TABLE radar_application_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL UNIQUE REFERENCES job_applications(id) ON DELETE CASCADE,
  consent_to_recruiter BOOLEAN NOT NULL DEFAULT FALSE,
  consent_to_cv BOOLEAN NOT NULL DEFAULT FALSE,
  consent_to_contact BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT radar_application_consents_consistency_check
    CHECK (consent_to_recruiter OR NOT (consent_to_cv OR consent_to_contact))
);

-- Mantener los IDs de las antiguas autorizaciones para seguimiento/auditoría.
INSERT INTO radar_application_consents
  (id,application_id,consent_to_recruiter,consent_to_cv,consent_to_contact,created_at,updated_at)
SELECT r.id,j.id,r.consent_to_recruiter,r.consent_to_cv,r.consent_to_contact,r.applied_at,now()
FROM radar_job_applications r
JOIN job_applications j ON j.job_offer_id=r.job_offer_id AND j.user_id=r.user_id
ON CONFLICT (application_id) DO NOTHING;

DO $$ BEGIN
 IF (SELECT COUNT(*) FROM radar_job_applications) <>
    (SELECT COUNT(*) FROM radar_application_consents) THEN
   RAISE EXCEPTION 'No se pudieron migrar todas las postulaciones de Radar';
 END IF;
END $$;

-- Los eventos de postulación apuntan ahora al identificador canónico.
UPDATE radar_audit_events a SET target_id=j.id
FROM radar_job_applications r
JOIN job_applications j ON j.job_offer_id=r.job_offer_id AND j.user_id=r.user_id
WHERE a.target_id=r.id AND a.event_type LIKE 'application.%';

-- Retirar la fuente paralela sólo después de verificar y guardar sus datos.
DROP TABLE radar_job_applications;

-- Fechas de creación, incluso en registros históricos.
ALTER TABLE radar_cv_evidence ADD COLUMN created_at TIMESTAMPTZ;
UPDATE radar_cv_evidence SET created_at=submitted_at;
ALTER TABLE radar_cv_evidence ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE radar_cv_evidence ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE radar_audit_events ADD COLUMN created_at TIMESTAMPTZ;
UPDATE radar_audit_events SET created_at=occurred_at;
ALTER TABLE radar_audit_events ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE radar_audit_events ALTER COLUMN created_at SET NOT NULL;

-- La tabla de relación empresa-reclutador requiere identificador propio.
ALTER TABLE radar_company_access ADD COLUMN id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE radar_company_access ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE radar_company_access DROP CONSTRAINT radar_company_access_pkey;
ALTER TABLE radar_company_access ADD CONSTRAINT radar_company_access_pkey PRIMARY KEY (id);
ALTER TABLE radar_company_access ADD CONSTRAINT radar_company_access_company_id_user_id_key UNIQUE (company_id,user_id);

-- Índices faltantes de claves foráneas.
CREATE INDEX radar_cv_evidence_user_id_idx ON radar_cv_evidence(user_id);
CREATE INDEX radar_cv_evidence_reviewer_id_idx ON radar_cv_evidence(reviewer_id);
CREATE INDEX radar_audit_events_actor_id_idx ON radar_audit_events(actor_id);
CREATE INDEX radar_company_access_user_id_idx ON radar_company_access(user_id);

-- Las referencias opcionales sobreviven a la eliminación del usuario responsable.
ALTER TABLE radar_cv_evidence DROP CONSTRAINT IF EXISTS radar_cv_evidence_reviewer_id_fkey;
ALTER TABLE radar_cv_evidence ADD CONSTRAINT radar_cv_evidence_reviewer_id_fkey
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE radar_audit_events DROP CONSTRAINT IF EXISTS radar_audit_events_actor_id_fkey;
ALTER TABLE radar_audit_events ADD CONSTRAINT radar_audit_events_actor_id_fkey
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL;

-- Catálogos de estados con valores controlados por FK, no CHECK de literales.
CREATE TABLE radar_extraction_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(24) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE radar_review_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(24) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO radar_extraction_statuses(id,title) VALUES
  (gen_random_uuid(),'pending'),(gen_random_uuid(),'ready'),
  (gen_random_uuid(),'error'),(gen_random_uuid(),'unreadable');
INSERT INTO radar_review_statuses(id,title) VALUES
  (gen_random_uuid(),'pending'),(gen_random_uuid(),'approved'),
  (gen_random_uuid(),'rejected'),(gen_random_uuid(),'revoked');
ALTER TABLE radar_cv_evidence DROP CONSTRAINT IF EXISTS radar_cv_evidence_extraction_status_check;
ALTER TABLE radar_cv_evidence DROP CONSTRAINT IF EXISTS radar_cv_evidence_review_status_check;
ALTER TABLE radar_cv_evidence ADD CONSTRAINT radar_cv_evidence_extraction_status_fkey
  FOREIGN KEY (extraction_status) REFERENCES radar_extraction_statuses(title) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE radar_cv_evidence ADD CONSTRAINT radar_cv_evidence_review_status_fkey
  FOREIGN KEY (review_status) REFERENCES radar_review_statuses(title) ON DELETE RESTRICT ON UPDATE CASCADE;
