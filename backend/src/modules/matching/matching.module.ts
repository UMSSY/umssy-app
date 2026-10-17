import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { MatchingController } from './controllers/matching.controller.js';
import { RequirementsController } from './controllers/requirements.controller.js';
import { MatchingService } from './services/matching.service.js';
import { NlpService } from './services/nlp.service.js';
import { RequirementTermsService } from './services/requirement-terms.service.js';
import { SkillsClassifierService } from './services/skills-classifier.service.js';
import { VacancyRankingService } from './services/vacancy-ranking.service.js';
import { WeightedScoreService } from './services/weighted-score.service.js';

@Module({
  imports: [JwtAuthModule, SkillsModule],
  controllers: [MatchingController, RequirementsController],
  providers: [
    MatchingService,
    NlpService,
    RequirementTermsService,
    SkillsClassifierService,
    VacancyRankingService,
    WeightedScoreService,
  ],
  exports: [
    MatchingService,
    NlpService,
    RequirementTermsService,
    SkillsClassifierService,
    VacancyRankingService,
    WeightedScoreService,
  ],
})
export class MatchingModule {}