import { JobApplicationsController } from './controllers/job-applications.controller.js';
import { JobApplicationsService } from './services/job-applications.service.js';
import { JobApplicationsRepository } from './repositories/job-applications.repository.js';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
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
import { ExperienceSkillsRepository } from './repositories/experience-skills.repository.js';
import { JobMatchController } from './controllers/job-match.controller.js';
import { JobMatchRepository } from './repositories/job-match.repository.js';
import { JobMatchService } from './services/job-match.service.js';
import { JobRecommendationsController } from './controllers/job-recommendations.controller.js';
import { JobRecommendationsService } from './services/job-recommendations.service.js';

@Module({
  imports: [PrismaModule, JwtAuthModule, SkillsModule, JobOffersModule],
  controllers: [
    MatchingController,
    JobMatchController,
    JobApplicationsController,
    JobRecommendationsController,
  ],
  providers: [
    JobApplicationsService,
    JobApplicationsRepository,
    MatchingService,
    ActiveJobOffersService,
    NlpService,
    RequirementTermsService,
    SkillsClassifierService,
    VacancyRankingService,
    WeightedScoreService,
    ExperienceSkillsRepository,
    JobMatchRepository,
    JobMatchService,
    JobRecommendationsService,
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
