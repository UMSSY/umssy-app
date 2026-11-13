import type {
  RecruiterVacancyResponse,
  ActiveVacancyResponse,
} from '../types/vacancy-response.type.js';
import { mapApplicationStatus } from './radar-applications.mapper.js';
import type { RecruiterCandidateInput } from '../types/recruiter-candidate-input.type.js';
import type { RecruiterAreaEvidenceInput } from '../types/recruiter-area-evidence-input.type.js';

export function mapRecruiterCandidate({
  application,
  user,
  latest,
  comparison,
  sharedContact,
}: RecruiterCandidateInput) {
  return {
    applicationId: application.id,
    userId: application.user_id,
    name: `${user.firstName} ${user.lastName}`,
    headline: user.headline ?? '',
    email: sharedContact.email,
    phone: sharedContact.phone,
    appliedAt: application.applied_at,
    state: mapApplicationStatus(application.status_title),
    canViewCv: application.consent_to_cv,
    version: latest.version,
    average: Number(latest.average_score),
    scores: latest.scores,
    evidence: latest.evidence ?? {},
    comparison,
    skills: Object.values(latest.evidence ?? {})
      .flat()
      .map((item) => item.name)
      .slice(0, 8),
  };
}

export function mapRecruiterAreaEvidence({
  education,
  certifications,
  experiences,
  publishedSkills,
}: RecruiterAreaEvidenceInput) {
  const duration = (start: Date, end: Date | null) => {
    const months = Math.max(
      0,
      Math.round(
        ((end ?? new Date()).getTime() - start.getTime()) /
          (1000 * 60 * 60 * 24 * 30.4375),
      ),
    );
    return months >= 12
      ? `${(months / 12).toLocaleString('es-BO', { maximumFractionDigits: 1 })} año(s)`
      : `${months} mes(es)`;
  };

  return {
    education: education.map((item) => ({
      id: item.id,
      degree: item.degree,
      institution: item.institution,
      year: item.startDate.getUTCFullYear(),
      description: item.description,
    })),
    certifications: certifications.map((item) => ({
      id: item.id,
      name: item.name,
      issuer: item.issuingOrganization,
      year: item.issueDate.getUTCFullYear(),
    })),
    experiences: experiences.map((item) => ({
      id: item.id,
      position: item.position,
      companyName: item.company.title,
      duration: duration(item.startDate, item.endDate),
      description: item.description,
    })),
    tags: [...new Set(publishedSkills.map((item) => item.name))],
  };
}

export function mapRecruiterVacancy(
  offer: RecruiterVacancyResponse,
): RecruiterVacancyResponse {
  return { id: offer.id, title: offer.title, companyId: offer.companyId };
}
export function mapActiveVacancy(
  job: ActiveVacancyResponse,
): ActiveVacancyResponse {
  return { ...mapRecruiterVacancy(job), description: job.description };
}
