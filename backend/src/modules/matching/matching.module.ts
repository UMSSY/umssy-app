import { JobApplicationsController } from './controllers/job-applications.controller.js';
import { JobRecommendationsController } from './controllers/job-recommendations.controller.js';
import { JobRecommendationsService } from './services/job-recommendations.service.js';
import { JobApplicationsService } from './services/job-applications.service.js';
import { JobApplicationsRepository } from './repositories/job-applications.repository.js';
import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { JobOffersModule } from '../job-offers/job-offers.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { MatchingController } from './controllers/matching.controller.js';
import { MatchingService } from './services/matching.service.js';
import { NlpService } from './services/nlp.service.js';
import { RequirementTermsService } from './services/requirement-terms.service.js';
import { SkillsClassifierService } from './services/skills-classifier.service.js';
import { VacancyRankingService } from './services/vacancy-ranking.service.js';
import { WeightedScoreService } from './services/weighted-score.service.js';
import { ActiveJobOffersService } from './services/active-job-offers.service.js';

@Module({
  imports: [JwtAuthModule, SkillsModule, JobOffersModule],
  controllers: [
    MatchingController,
    JobApplicationsController,
    JobRecommendationsController,
  ],
  providers: [
    JobRecommendationsService,
    JobApplicationsService,
    JobApplicationsRepository,
    MatchingService,
    ActiveJobOffersService,
    NlpService,
    RequirementTermsService,
    SkillsClassifierService,
    VacancyRankingService,
    WeightedScoreService,
  ],
  exports: [
    MatchingService,
    ActiveJobOffersService,
    NlpService,
    RequirementTermsService,
    SkillsClassifierService,
    VacancyRankingService,
    WeightedScoreService,
  ],
})
export class MatchingModule {}
