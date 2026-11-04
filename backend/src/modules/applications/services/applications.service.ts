import { Injectable } from '@nestjs/common';
import { ApplicationsRepository } from '../repositories/applications.repository.js';
import type { FindApplicationsQueryDto } from '../requests/find-applications.request.js';
import {
  ApplicationStatus,
  type ApplicationItemResponse,
} from '../types/applications.types.js';
import type { ApplicationRecord } from '../types/application-record.types.js';
import { ApplicationNotFoundException } from '../exceptions/application-not-found.exception.js';
import { ApplicationForbiddenException } from '../exceptions/application-forbidden.exception.js';
import { ApplicationNotWithdrawableException } from '../exceptions/application-not-withdrawable.exception.js';
import { ApplicationMapper } from '../mappers/application.mapper.js';
import { JobRecommendationsService } from '../../matching/services/job-recommendations.service.js';

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
  if (!records || !records.length) return [];

  // Extraer los IDs de las vacantes de forma segura independientemente de la estructura del tipo
  const offerIds = records.map(
    (record: any) => record.jobOfferId ?? record.jobOffer?.id,
  );

  let scoresMap = new Map<string, number>();
  try {
    scoresMap = await this.matching.scoresForOffers(userId, offerIds);
  } catch {
    scoresMap = new Map();
  }

  const responses: ApplicationItemResponse[] = records.map((record: any) => {
    const offerId = record.jobOfferId ?? record.jobOffer?.id;
    const score = scoresMap.get(offerId) ?? 0;
    return this.mapper.toResponse(record, score);
  });

  if (query.sortBy === 'affinity') {
    responses.sort(
      (a: ApplicationItemResponse, b: ApplicationItemResponse) =>
        (a.affinityPercentage - b.affinityPercentage) *
        (query.sortOrder === 'asc' ? 1 : -1),
    );
  }

  return responses;
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
}