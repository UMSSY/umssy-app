import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { ProfileSkillsAnalysisController } from './controllers/profile-skills-analysis.controller.js';
import { ProfileSkillsRadarMapper } from './mappers/profile-skills-radar.mapper.js';
import { ProfileSkillResultsRepository } from './repositories/profile-skill-results.repository.js';
import { ProfileSkillSourcesRepository } from './repositories/profile-skill-sources.repository.js';
import { ProfileSkillsAnalysisService } from './services/profile-skills-analysis.service.js';
import { SkillDetectionService } from './services/skill-detection.service.js';
import { SkillValidationService } from './services/skill-validation.service.js';

@Module({
  imports: [PrismaModule, JwtAuthModule],
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
