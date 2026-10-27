import { forwardRef, Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { ProfileSkillsEventsModule } from '../../common/profile-skills/profile-skills-events.module.js';
import { CertificationSourcesModule } from '../certifications/certification-sources.module.js';
import { RadarEvidenceSourcesModule } from '../radar-integration/radar-evidence-sources.module.js';
import { ProfileModule } from '../profile/profile.module.js';
import { WorkExperienceModule } from '../work-experience/work-experience.module.js';
import { EducationsModule } from '../educations/educations.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { ProfileSkillsAnalysisController } from './controllers/profile-skills-analysis.controller.js';
import { ProfileSkillsRadarMapper } from './mappers/profile-skills-radar.mapper.js';
import { ProfileSkillResultsRepository } from './repositories/profile-skill-results.repository.js';
import { ProfileSkillSourcesRepository } from './repositories/profile-skill-sources.repository.js';
import { ProfileSkillsAnalysisService } from './services/profile-skills-analysis.service.js';
import { SkillDetectionService } from './services/skill-detection.service.js';
import { SkillValidationService } from './services/skill-validation.service.js';

@Module({
  imports: [
    PrismaModule,
    ProfileSkillsEventsModule,
    CertificationSourcesModule,
    RadarEvidenceSourcesModule,
    JwtAuthModule,
    ProfileModule,
    forwardRef(() => WorkExperienceModule),
    forwardRef(() => EducationsModule),
    forwardRef(() => SkillsModule),
  ],
  controllers: [ProfileSkillsAnalysisController],
  providers: [
    ProfileSkillsAnalysisService,
    SkillDetectionService,
    SkillValidationService,
    ProfileSkillSourcesRepository,
    ProfileSkillResultsRepository,
    ProfileSkillsRadarMapper,
  ],
  exports: [ProfileSkillsAnalysisService],
})
export class NlpModule {}
