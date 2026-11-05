import type { ApplicationRow } from '../repositories/radar-applications.repository.js';

export type RadarApplicationState =
  | 'applied'
  | 'interview'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

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
