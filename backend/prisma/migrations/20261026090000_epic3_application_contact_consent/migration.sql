-- Épica 3 HU4: consentimiento independiente y revocable para datos de contacto.
-- No cambia los permisos ya concedidos para radar ni CV.
ALTER TABLE radar_job_applications
  ADD COLUMN IF NOT EXISTS consent_to_contact BOOLEAN NOT NULL DEFAULT FALSE;
