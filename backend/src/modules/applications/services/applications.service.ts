import { Injectable } from '@nestjs/common';
import { ApplicationsRepository } from '../repositories/applications.repository.js';
import type { ApplicationRecord } from '../types/application-record.types.js';
import type { FindApplicationsQueryDto } from '../requests/find-applications.request.js';
import {
  ApplicationStatus,
  type ApplicationItemResponse,
} from '../types/applications.types.js';
import { ApplicationNotFoundException } from '../exceptions/application-not-found.exception.js';
import { ApplicationForbiddenException } from '../exceptions/application-forbidden.exception.js';
import { ApplicationNotWithdrawableException } from '../exceptions/application-not-withdrawable.exception.js';
import { ApplicationNotReactivableException } from '../exceptions/application-not-reactivable.exception.js';
import { ApplicationContactRestrictedException } from '../exceptions/application-contact-restricted.exception.js';
import type { ApplicationContactResponse } from '../types/application-contact-response.types.js';
import { ApplicationMapper } from '../mappers/application.mapper.js';
import { JobRecommendationsService } from '../../matching/services/job-recommendations.service.js';
import type { ApplicationDecisionContext } from '../types/application-decision-context.types.js';
import { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import { UsersService } from '../../users/services/users.service.js';

const CONTACTABLE_STATUSES: readonly string[] = [
  ApplicationStatus.IN_REVIEW,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.ACCEPTED,
];

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly repository: ApplicationsRepository,
    private readonly mapper: ApplicationMapper,
    private readonly matching: JobRecommendationsService,
    private readonly jobOffers: JobOffersService,
    private readonly users: UsersService,
  ) {}

  async findMyApplications(
    userId: string,
    query: FindApplicationsQueryDto,
  ): Promise<ApplicationItemResponse[]> {
    const records = await this.repository.findByUserId(userId, query);
    if (!records || !records.length) return [];

    const offerIds = records.map(
      (record: ApplicationRecord) => record.jobOfferId,
    );
    const scoresMap = await this.matching.scoresForOffers(userId, offerIds);

    const responses: ApplicationItemResponse[] = records.map(
      (record: ApplicationRecord) => {
        const score = scoresMap.get(record.jobOfferId) ?? 0;
        return this.mapper.toResponse(record, score);
      },
    );

    const statuses = [
      ApplicationStatus.IN_REVIEW,
      ApplicationStatus.INTERVIEW,
      ApplicationStatus.ACCEPTED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
    ];

    const collator = new Intl.Collator('es', { sensitivity: 'base' });
    const direction = query.sortOrder === 'asc' ? 1 : -1;

    responses.sort((a, b) => {
      let comparison = 0;

      switch (query.sortBy) {
        case 'vacancy':
          comparison =
            collator.compare(a.vacancyTitle, b.vacancyTitle) * direction;
          break;
        case 'company':
          comparison =
            collator.compare(a.companyName, b.companyName) * direction;
          break;
        case 'affinity':
          comparison =
            (a.affinityPercentage - b.affinityPercentage) * direction;
          break;
        case 'status': {
          const aIndex = statuses.indexOf(a.status as ApplicationStatus);
          const bIndex = statuses.indexOf(b.status as ApplicationStatus);
          comparison =
            ((aIndex === -1 ? statuses.length : aIndex) -
              (bIndex === -1 ? statuses.length : bIndex)) *
            direction;
          break;
        }
        case 'date':
          comparison =
            (Date.parse(a.appliedDate) - Date.parse(b.appliedDate)) * direction;
          break;
        default:
          comparison = Date.parse(b.appliedDate) - Date.parse(a.appliedDate);
      }

      if (comparison !== 0) return comparison;

      const dateDifference =
        Date.parse(b.appliedDate) - Date.parse(a.appliedDate);

      if (dateDifference !== 0) return dateDifference;

      const titleDifference = collator.compare(a.vacancyTitle, b.vacancyTitle);

      return titleDifference || a.id.localeCompare(b.id);
    });

    return responses;
  }

  async reactivateApplication(id: string, userId: string): Promise<void> {
    const application = await this.repository.findById(id);
    if (!application) throw new ApplicationNotFoundException();
    if (application.userId !== userId)
      throw new ApplicationForbiddenException();

    const result = await this.repository.reactivateApplication(
      id,
      userId,
      new Date(),
    );

    if (result.count !== 1) throw new ApplicationNotReactivableException();
  }

  async getApplicationContact(
    id: string,
    userId: string,
  ): Promise<ApplicationContactResponse> {
    const application = await this.findApplicationDecisionContext(id);
    if (!application || application.userId !== userId)
      throw new ApplicationNotFoundException();
    if (!CONTACTABLE_STATUSES.includes(application.statusTitle))
      throw new ApplicationContactRestrictedException();
    const recruiters = await this.users.findActiveRecruitersByCompany(
      application.companyId,
    );
    return this.mapper.toContactResponse(application, recruiters);
  }

  async withdrawApplication(id: string, userId: string): Promise<void> {
    const application = await this.repository.findById(id);
    if (!application) throw new ApplicationNotFoundException();
    if (application.userId !== userId)
      throw new ApplicationForbiddenException();

    const result = await this.repository.withdraw(
      id,
      userId,
      [ApplicationStatus.IN_REVIEW, ApplicationStatus.INTERVIEW],
      ApplicationStatus.WITHDRAWN,
    );
    if (!result.count) throw new ApplicationNotWithdrawableException();
  }

  async validateApplicationForChat(
    applicationId: string,
    studentUserId: string,
    companyId: string,
  ): Promise<{
    isValid: boolean;
    vacancyTitle: string | null;
    companyName: string | null;
  }> {
    const record = await this.repository.findApplicationForChat(applicationId);
    if (!record) {
      return { isValid: false, vacancyTitle: null, companyName: null };
    }

    if (
      record.userId !== studentUserId ||
      record.jobOffer.companyId !== companyId
    ) {
      return { isValid: false, vacancyTitle: null, companyName: null };
    }

    const normalizedStatus = record.status.title.trim().toLowerCase();
    const isInactive =
      normalizedStatus.includes('rechazad') ||
      normalizedStatus.includes('retirad') ||
      normalizedStatus.includes('cancelad');

    if (isInactive) {
      return { isValid: false, vacancyTitle: null, companyName: null };
    }

    return {
      isValid: true,
      vacancyTitle: record.jobOffer.title,
      companyName: record.jobOffer.company.title,
    };
  }

  async findVacancyTitleForChat(applicationId: string): Promise<string | null> {
    const record = await this.repository.findApplicationForChat(applicationId);
    return record?.jobOffer?.title ?? null;
  }

  findRecruitmentApplicationsByUser(userId: string) {
    return this.repository.findRecruitmentApplicationsByUser(userId);
  }

  findRecruitmentApplicants(jobId: string) {
    return this.repository.findRecruitmentApplicants(jobId);
  }

  findRecruitmentApplication(id: string) {
    return this.repository.findRecruitmentApplication(id);
  }

  async findApplicationDecisionContext(
    id: string,
  ): Promise<ApplicationDecisionContext | null> {
    const application =
      await this.repository.findApplicationDecisionContext(id);
    if (!application) return null;

    const offer = await this.jobOffers.findOfferSummary(application.jobOfferId);
    if (!offer) return null;

    return {
      id: application.id,
      userId: application.userId,
      statusTitle: application.status.title,
      jobOfferId: application.jobOfferId,
      companyId: offer.companyId,
      jobTitle: offer.title,
      companyName: offer.companyName,
    };
  }

  recordRecruiterDecision(applicationId: string, target: string) {
    return this.repository.recordRecruiterDecision(applicationId, target);
  }
}
