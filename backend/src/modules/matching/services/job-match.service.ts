import { Injectable } from '@nestjs/common';
import { JobOfferNotAvailableException } from '../exceptions/job-offer-not-available.exception.js';
import { JobMatchRepository } from '../repositories/job-match.repository.js';
import type { JobMatchResponse } from '../types/job-match.types.js';
import {
  hasPendingRequirements,
  toCategorizedRequirements,
} from '../utils/build-score-requirements.js';
import { VacancyScoringService } from './vacancy-scoring.service.js';

@Injectable()
export class JobMatchService {
  constructor(
    private readonly jobMatchRepository: JobMatchRepository,
    private readonly vacancyScoring: VacancyScoringService,
  ) {}

  async getMatch(
    userId: string,
    jobOfferId: string,
  ): Promise<JobMatchResponse> {
    const vacancy = await this.jobMatchRepository.findPublishedById(
      jobOfferId,
      new Date(),
    );
    if (!vacancy) {
      throw new JobOfferNotAvailableException();
    }

    const candidate = await this.vacancyScoring.getCandidate(userId);
    const { requirements, score } = await this.vacancyScoring.evaluate(
      vacancy,
      candidate,
    );

    return {
      jobOfferId: vacancy.id,
      title: vacancy.title,
      companyName: vacancy.company.title,
      modality: vacancy.modality.title,
      description: vacancy.description,
      score,
      hasPendingRequirements: hasPendingRequirements(requirements),
      requirements: toCategorizedRequirements(requirements),
    };
  }
}
