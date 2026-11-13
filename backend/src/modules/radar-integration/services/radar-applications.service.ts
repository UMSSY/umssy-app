import { Injectable } from '@nestjs/common';
import { ApplicationsService } from '../../applications/services/applications.service.js';
import { RadarApplicationsRepository } from '../repositories/radar-applications.repository.js';
import { mapConsentedApplication } from '../mappers/radar-applications.mapper.js';
import type { RecruitmentApplication } from '../../applications/types/recruitment-application.type.js';

@Injectable()
export class RadarApplicationsService {
  constructor(
    private readonly applications: ApplicationsService,
    private readonly consents: RadarApplicationsRepository,
  ) {}

  setConsents(
    applicationId: string,
    consent: boolean,
    cv: boolean,
    contact: boolean,
  ) {
    return this.consents.setConsents(applicationId, consent, cv, contact);
  }

  revokeConsents(applicationId: string) {
    return this.consents.revokeConsents(applicationId);
  }

  private async withConsents(rows: RecruitmentApplication[]) {
    const consents = await this.consents.findConsents(
      rows.map((row) => row.id),
    );
    const byId = new Map(
      consents.map((consent) => [consent.application_id, consent]),
    );
    return rows.map((row) => mapConsentedApplication(row, byId.get(row.id)));
  }

  async myApplications(userId: string) {
    return this.withConsents(
      await this.applications.findRecruitmentApplicationsByUser(userId),
    );
  }

  async applicants(jobId: string) {
    return this.withConsents(
      await this.applications.findRecruitmentApplicants(jobId),
    );
  }

  async updateConsents(
    userId: string,
    applicationId: string,
    consent: boolean,
    cv: boolean,
    contact: boolean,
  ) {
    const application =
      await this.applications.findRecruitmentApplication(applicationId);
    if (
      !application ||
      application.userId !== userId ||
      application.status.title === 'Retirada'
    )
      return [];
    await this.consents.setConsents(applicationId, consent, cv, contact);
    return [{ id: applicationId, status_title: application.status.title }];
  }

  async companyForCv(applicationId: string) {
    const application =
      await this.applications.findRecruitmentApplication(applicationId);
    if (!application || application.status.title === 'Retirada') return [];
    const consent = (await this.consents.findConsents([applicationId]))[0];
    if (!consent?.consent_to_recruiter) return [];
    return [
      {
        user_id: application.userId,
        company_id: application.jobOffer.companyId,
        consent_to_cv: consent.consent_to_cv,
      },
    ];
  }

  companyForEvidence(applicationId: string) {
    return this.companyForCv(applicationId);
  }

  async companyForDecision(applicationId: string) {
    const application =
      await this.applications.findRecruitmentApplication(applicationId);
    return application
      ? [
          {
            user_id: application.userId,
            company_id: application.jobOffer.companyId,
          },
        ]
      : [];
  }

  recordRecruiterDecision(applicationId: string, target: string) {
    return this.applications.recordRecruiterDecision(applicationId, target);
  }
}
