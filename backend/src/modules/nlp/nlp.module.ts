import { Module } from '@nestjs/common';
import { CvModule } from '../cv/cv.module.js';
import { CertificationDocumentsModule } from '../certification-documents/certification-documents.module.js';
import { ProfileSkillStateModule } from './profile-skill-state.module.js';
import { DocumentSkillTextExtractorService } from './services/document-skill-text-extractor.service.js';
import { EducationSourcesModule } from '../educations/education-sources.module.js';
import { WorkExperienceSourcesModule } from '../work-experience/work-experience-sources.module.js';
import { SkillAnalysisModule } from '../skills/skill-analysis.module.js';
import { ProfileModule } from '../profile/profile.module.js';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { ProfileSkillsAnalysisController } from './controllers/profile-skills-analysis.controller.js';
import { ProfileSkillsRadarMapper } from './mappers/profile-skills-radar.mapper.js';
import { ProfileSkillSourcesService } from './services/profile-skill-sources.service.js';
import { ProfileSkillsAnalysisService } from './services/profile-skills-analysis.service.js';
import { SkillDetectionService } from './services/skill-detection.service.js';
import { SkillValidationService } from './services/skill-validation.service.js';

@Module({
  imports: [PrismaModule, JwtAuthModule, EducationSourcesModule, WorkExperienceSourcesModule, SkillAnalysisModule, ProfileModule, CvModule, CertificationDocumentsModule, ProfileSkillStateModule],
  controllers: [ProfileSkillsAnalysisController],
  providers: [
    ProfileSkillsAnalysisService,
    SkillDetectionService,
    SkillValidationService,
    ProfileSkillSourcesService,
    DocumentSkillTextExtractorService,
    ProfileSkillsRadarMapper,
  ],
  exports: [ProfileSkillsAnalysisService],
})
export class NlpModule {}
