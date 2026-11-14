import { ConflictException, Injectable } from '@nestjs/common';
import { ApplicationsRepository } from '../repositories/applications.repository.js';
import type { FindApplicationsQueryDto } from '../requests/find-applications.request.js';
import {
  ApplicationStatus,
  type ApplicationItemResponse,
} from '../types/applications.types.js';
import { ApplicationNotFoundException } from '../exceptions/application-not-found.exception.js';
import { ApplicationForbiddenException } from '../exceptions/application-forbidden.exception.js';
import { ApplicationNotWithdrawableException } from '../exceptions/application-not-withdrawable.exception.js';
import { ApplicationContactRestrictedException } from '../exceptions/application-contact-restricted.exception.js';
import type { ApplicationContactResponse } from '../types/application-contact.types.js';
import { ApplicationMapper } from '../mappers/application.mapper.js';
import { JobRecommendationsService } from '../../matching/services/job-recommendations.service.js';

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
  ) {}

  async findMyApplications(
    userId: string,
    query: FindApplicationsQueryDto,
  ): Promise<ApplicationItemResponse[]> {
    const records = await this.repository.findByUserId(userId, query);
    if (!records.length) return [];
    const scores = await this.matching.scoresForOffers(
      userId,
      records.map((record) => record.jobOfferId),
    );
    const responses = records.map((record) =>
      this.mapper.toResponse(record, scores.get(record.jobOfferId) ?? 0),
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
            (Date.parse(a.appliedDate) - Date.parse(b.appliedDate)) *
            direction;
          break;
        default:
          comparison =
            Date.parse(b.appliedDate) - Date.parse(a.appliedDate);
      }

      if (comparison !== 0) return comparison;

      const dateDifference =
        Date.parse(b.appliedDate) - Date.parse(a.appliedDate);

      if (dateDifference !== 0) return dateDifference;

      const titleDifference = collator.compare(
        a.vacancyTitle,
        b.vacancyTitle,
      );

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

    if (result.count !== 1) {
      throw new ConflictException(
        'La postulación no puede reactivarse en su estado actual o la vacante ya no está disponible.',
      );
    }
  }

  async getApplicationContact(
    id: string,
    userId: string,
  ): Promise<ApplicationContactResponse> {
    const application = await this.repository.findContactContext(id);
    if (!application || application.userId !== userId)
      throw new ApplicationNotFoundException();
    if (!CONTACTABLE_STATUSES.includes(application.status.title))
      throw new ApplicationContactRestrictedException();
    return this.mapper.toContactResponse(application);
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
  findRecruitmentApplicationsByUser(userId: string) {
    return this.repository.findRecruitmentApplicationsByUser(userId);
  }
  findRecruitmentApplicants(jobId: string) {
    return this.repository.findRecruitmentApplicants(jobId);
  }
  findRecruitmentApplication(id: string) {
    return this.repository.findRecruitmentApplication(id);
  }
  recordRecruiterDecision(applicationId: string, target: string) {
    return this.repository.recordRecruiterDecision(applicationId, target);
  }
}
