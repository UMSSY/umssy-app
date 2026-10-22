import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { JobOffersModule } from '../job-offers/job-offers.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { JobApplicationsController } from './controllers/job-applications.controller.js';
import { MatchingController } from './controllers/matching.controller.js';
import { JobApplicationsRepository } from './repositories/job-applications.repository.js';
import { JobApplicationsService } from './services/job-applications.service.js';
import { MatchingService } from './services/matching.service.js';
import { NlpService } from './services/nlp.service.js';
import { SkillsClassifierService } from './services/skills-classifier.service.js';
import { VacancyRankingService } from './services/vacancy-ranking.service.js';
import { WeightedScoreService } from './services/weighted-score.service.js';
import { ActiveJobOffersService } from './services/active-job-offers.service.js';

@Module({
  imports: [JwtAuthModule, SkillsModule, JobOffersModule],
  controllers: [MatchingController, JobApplicationsController],
  providers: [
    MatchingService,
    ActiveJobOffersService,
    JobApplicationsRepository,
    JobApplicationsService,
    NlpService,
    SkillsClassifierService,
    VacancyRankingService,
    WeightedScoreService,
  ],
  exports: [
    MatchingService,
    ActiveJobOffersService,
    NlpService,
    SkillsClassifierService,
    VacancyRankingService,
    WeightedScoreService,
  ],
})
export class MatchingModule {}
