import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

export interface ApplicationRow {
  id: string;
  job_offer_id: string;
  user_id: string;
  status_title: string;
  applied_at: Date;
  consent_to_recruiter: boolean;
  consent_to_cv: boolean;
  consent_to_contact: boolean;
}

/**
 * Consentimientos de postulación que habilitan el radar ante un reclutador.
 *
 * La creación y las reglas de postulación viven en `JobApplicationsService`;
 * aquí sólo se persisten y consultan los consentimientos independientes
 * (radar, CV y contacto) más las lecturas propias del reclutador.
 */
@Injectable()
export class RadarApplicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async setConsents(
    applicationId: string,
    consent: boolean,
    cv: boolean,
    contact: boolean,
  ) {
    return this.prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO radar_application_consents(application_id,consent_to_recruiter,consent_to_cv,consent_to_contact)
      VALUES (${applicationId}::uuid,${consent},${consent && cv},${consent && contact})
      ON CONFLICT(application_id) DO UPDATE SET
        consent_to_recruiter=EXCLUDED.consent_to_recruiter,consent_to_cv=EXCLUDED.consent_to_cv,
        consent_to_contact=EXCLUDED.consent_to_contact,updated_at=now()
      RETURNING application_id AS id`;
  }

  myApplications(userId: string) {
    return this.prisma.$queryRaw<ApplicationRow[]>`
      SELECT a.id,a.job_offer_id,a.user_id,st.title AS status_title,a.applied_at,
        COALESCE(c.consent_to_recruiter,FALSE) AS consent_to_recruiter,
        COALESCE(c.consent_to_cv,FALSE) AS consent_to_cv,
        COALESCE(c.consent_to_contact,FALSE) AS consent_to_contact
      FROM job_applications a
      JOIN job_application_statuses st ON st.id=a.status_id
      LEFT JOIN radar_application_consents c ON c.application_id=a.id
      WHERE a.user_id=${userId}::uuid ORDER BY a.applied_at DESC`;
  }

  updateConsents(
    userId: string,
    applicationId: string,
    consent: boolean,
    cv: boolean,
    contact: boolean,
  ) {
    return this.prisma.$queryRaw<{ id: string; status_title: string }[]>`
      WITH mine AS (
        SELECT a.id,st.title AS status_title FROM job_applications a
        JOIN job_application_statuses st ON st.id=a.status_id
        WHERE a.id=${applicationId}::uuid AND a.user_id=${userId}::uuid AND st.title<>'Retirada'
      ), saved AS (
        INSERT INTO radar_application_consents(application_id,consent_to_recruiter,consent_to_cv,consent_to_contact)
        SELECT id,${consent},${consent && cv},${consent && contact} FROM mine
        ON CONFLICT(application_id) DO UPDATE SET
          consent_to_recruiter=EXCLUDED.consent_to_recruiter,
          consent_to_cv=EXCLUDED.consent_to_cv,
          consent_to_contact=EXCLUDED.consent_to_contact,updated_at=now()
        RETURNING application_id
      ) SELECT mine.id,mine.status_title FROM mine JOIN saved ON saved.application_id=mine.id`;
  }

  withdraw(userId: string, applicationId: string) {
    return this.prisma.$queryRaw<{ id: string }[]>`
      WITH withdrawn AS (
        UPDATE job_applications a SET status_id=withdrawn_status.id,updated_at=now()
        FROM job_application_statuses withdrawn_status
        WHERE a.id=${applicationId}::uuid AND a.user_id=${userId}::uuid
          AND withdrawn_status.title='Retirada'
          AND a.status_id IN (SELECT id FROM job_application_statuses WHERE title IN ('En revisión','Entrevista'))
        RETURNING a.id
      ), saved AS (
        INSERT INTO radar_application_consents(application_id,consent_to_recruiter,consent_to_cv,consent_to_contact)
        SELECT id,FALSE,FALSE,FALSE FROM withdrawn
        ON CONFLICT(application_id) DO UPDATE SET
          consent_to_recruiter=FALSE,consent_to_cv=FALSE,consent_to_contact=FALSE,updated_at=now()
        RETURNING application_id
      ) SELECT withdrawn.id FROM withdrawn JOIN saved ON saved.application_id=withdrawn.id`;
  }

  applicants(jobId: string) {
    return this.prisma.$queryRaw<ApplicationRow[]>`
      SELECT a.id,a.job_offer_id,a.user_id,st.title AS status_title,a.applied_at,
        COALESCE(c.consent_to_recruiter,FALSE) AS consent_to_recruiter,
        COALESCE(c.consent_to_cv,FALSE) AS consent_to_cv,
        COALESCE(c.consent_to_contact,FALSE) AS consent_to_contact
      FROM job_applications a
      JOIN job_application_statuses st ON st.id=a.status_id
      LEFT JOIN radar_application_consents c ON c.application_id=a.id
      WHERE a.job_offer_id=${jobId}::uuid AND st.title<>'Retirada'
      ORDER BY a.applied_at DESC`;
  }

  companyForEvidence(applicationId: string) {
    return this.prisma.$queryRaw<{ user_id: string; company_id: string }[]>`
      SELECT a.user_id,j.company_id FROM job_applications a
      JOIN job_offers j ON j.id=a.job_offer_id
      JOIN job_application_statuses st ON st.id=a.status_id
      JOIN radar_application_consents c ON c.application_id=a.id
      WHERE a.id=${applicationId}::uuid AND c.consent_to_recruiter=TRUE AND st.title<>'Retirada'`;
  }

  companyForCv(applicationId: string) {
    return this.prisma.$queryRaw<{ user_id: string; company_id: string; consent_to_cv: boolean }[]>`
      SELECT a.user_id,j.company_id,c.consent_to_cv FROM job_applications a
      JOIN job_offers j ON j.id=a.job_offer_id
      JOIN job_application_statuses st ON st.id=a.status_id
      JOIN radar_application_consents c ON c.application_id=a.id
      WHERE a.id=${applicationId}::uuid AND c.consent_to_recruiter=TRUE AND st.title<>'Retirada'`;
  }

  companyForDecision(applicationId: string) {
    return this.prisma.$queryRaw<{ user_id: string; company_id: string }[]>`
      SELECT a.user_id,j.company_id FROM job_applications a
      JOIN job_offers j ON j.id=a.job_offer_id WHERE a.id=${applicationId}::uuid`;
  }

  recordRecruiterDecision(applicationId: string, target: string) {
    return this.prisma.$queryRaw<{ id: string }[]>`
      UPDATE job_applications a SET status_id=target_status.id,updated_at=now()
      FROM job_application_statuses target_status
      WHERE a.id=${applicationId}::uuid AND target_status.title=${target}
      AND a.status_id IN (SELECT id FROM job_application_statuses WHERE title IN ('En revisión','Entrevista'))
      RETURNING a.id`;
  }
}
