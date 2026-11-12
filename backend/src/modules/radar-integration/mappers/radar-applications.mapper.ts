import type { RecruitmentApplication } from '../../applications/types/recruitment-application.type.js';
import type { RadarApplicationConsent } from '../types/radar-application-consent.type.js';
import type { RadarApplicationState } from '../types/radar-application-state.type.js';
import type { ApplicationRow } from '../types/application-row.type.js';

export function mapApplicationStatus(title: string): RadarApplicationState {
  switch (title) {
    case 'Entrevista':
      return 'interview';
    case 'Aceptada':
      return 'hired';
    case 'No seleccionado':
      return 'rejected';
    case 'Retirada':
      return 'withdrawn';
    default:
      return 'applied';
  }
}

export function mapApplicationSummary(row: ApplicationRow) {
  return {
    id: row.id,
    jobOfferId: row.job_offer_id,
    state: mapApplicationStatus(row.status_title),
    appliedAt: row.applied_at,
    consent: row.consent_to_recruiter,
    consentCv: row.consent_to_cv,
    consentContact: row.consent_to_contact,
  };
}

export function mapConsentedApplication(
  row: RecruitmentApplication,
  consent?: RadarApplicationConsent,
): ApplicationRow {
  return {
    id: row.id,
    job_offer_id: row.jobOfferId,
    user_id: row.userId,
    status_title: row.status.title,
    applied_at: row.appliedAt,
    consent_to_recruiter: consent?.consent_to_recruiter ?? false,
    consent_to_cv: consent?.consent_to_cv ?? false,
    consent_to_contact: consent?.consent_to_contact ?? false,
  };
}
