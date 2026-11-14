import type { ApplicationConsentsResponse } from '../types/application-consents-response.type.js';
import type { ApplicationResponse } from '../types/application-response.type.js';
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

export function mapApplicationConsent(row: {
  applicationId: string;
  consentToRecruiter: boolean;
  consentToCv: boolean;
  consentToContact: boolean;
}): RadarApplicationConsent {
  return {
    application_id: row.applicationId,
    consent_to_recruiter: row.consentToRecruiter,
    consent_to_cv: row.consentToCv,
    consent_to_contact: row.consentToContact,
  };
}
export function mapApplicationConsentsResponse(
  id: string,
  status: string,
  consent: boolean,
  consentCv: boolean,
  consentContact: boolean,
): ApplicationConsentsResponse {
  return {
    id,
    state: mapApplicationStatus(status),
    consent,
    consentCv,
    consentContact,
  };
}
export function mapApplicationResponse(
  id: string,
  jobOfferId: string,
  status: string,
  consent: boolean,
  consentCv: boolean,
  consentContact: boolean,
): ApplicationResponse {
  return {
    ...mapApplicationConsentsResponse(
      id,
      status,
      consent,
      consentCv,
      consentContact,
    ),
    jobOfferId,
  };
}
