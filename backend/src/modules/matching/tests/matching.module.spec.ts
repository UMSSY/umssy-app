import { beforeEach, describe, expect, it } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MatchingModule } from '../matching.module.js';
import { JobRecommendationsController } from '../controllers/job-recommendations.controller.js';
import { MatchingController } from '../controllers/matching.controller.js';
import { JobRecommendationsService } from '../services/job-recommendations.service.js';
import { MatchingService } from '../services/matching.service.js';
import { NlpService } from '../services/nlp.service.js';
import { RequirementTermsService } from '../services/requirement-terms.service.js';
import { RequirementsController } from '../controllers/requirements.controller.js';
import { VacancyRankingService } from '../services/vacancy-ranking.service.js';
import { WeightedScoreService } from '../services/weighted-score.service.js';

describe('MatchingModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MatchingModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
  });

  it.each([
    MatchingController,
    RequirementsController,
    JobRecommendationsController,
    JobRecommendationsService,
    MatchingService,
    NlpService,
    RequirementTermsService,
    VacancyRankingService,
    WeightedScoreService,
  ])('resuelve %o', (provider) => {
    expect(moduleRef.get(provider)).toBeInstanceOf(provider);
  });
});
