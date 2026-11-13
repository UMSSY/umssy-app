import { CompanyJobApplicantsController } from './controllers/company-job-applicants.controller.js';
import { JobApplicationsController } from './controllers/job-applications.controller.js';
import { CompanyJobApplicantsService } from './services/company-job-applicants.service.js';
import { JobApplicationsService } from './services/job-applications.service.js';
import { JobApplicationsRepository } from './repositories/job-applications.repository.js';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { EducationsModule } from '../educations/educations.module.js';
import { JobOffersModule } from '../job-offers/job-offers.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { WorkExperienceModule } from '../work-experience/work-experience.module.js';
import { MatchingController } from './controllers/matching.controller.js';
import { MatchingService } from './services/matching.service.js';
import { NlpService } from './services/nlp.service.js';
import { RequirementTermsService } from './services/requirement-terms.service.js';
import { SkillsClassifierService } from './services/skills-classifier.service.js';
import { VacancyRankingService } from './services/vacancy-ranking.service.js';
import { WeightedScoreService } from './services/weighted-score.service.js';
import { ActiveJobOffersService } from './services/active-job-offers.service.js';
import { ExperienceSkillsService } from './services/experience-skills.service.js';
import { JobMatchController } from './controllers/job-match.controller.js';
import { JobMatchSourceService } from './services/job-match-source.service.js';
import { JobMatchService } from './services/job-match.service.js';
import { VacancyScoringService } from './services/vacancy-scoring.service.js';
import { CandidateProfileService } from './services/candidate-profile.service.js';
import { JobApplicationMapper } from './mappers/job-application.mapper.js';
import { JobRecommendationsController } from './controllers/job-recommendations.controller.js';
import { JobRecommendationsService } from './services/job-recommendations.service.js';
import { RequirementsController } from './controllers/requirements.controller.js'; 

@Module({
  imports: [
    PrismaModule,
    JwtAuthModule,
    SkillsModule,
    JobOffersModule,
    EducationsModule,
    WorkExperienceModule,
  ],
  controllers: [
    MatchingController,
    JobMatchController,
    JobApplicationsController,
    JobRecommendationsController,
    CompanyJobApplicantsController,
    RequirementsController,
  ],
  providers: [
    JobApplicationsService,
    CompanyJobApplicantsService,
    JobApplicationsRepository,
    JobApplicationMapper,
    MatchingService,
    ActiveJobOffersService,
    NlpService,
    RequirementTermsService,
    SkillsClassifierService,
    VacancyRankingService,
    WeightedScoreService,
    ExperienceSkillsService,
    JobMatchSourceService,
    VacancyScoringService,
    JobMatchService,
    CandidateProfileService,
    JobRecommendationsService,
  ],
  exports: [
    JobRecommendationsService,
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
