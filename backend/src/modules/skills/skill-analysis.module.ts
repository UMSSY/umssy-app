import { UsersModule } from '../users/users.module.js';
import { SkillEvidenceSourcesService } from './services/skill-evidence-sources.service.js';
import { CvSourcesModule } from '../cv/cv-sources.module.js';
import { CertificationSourcesModule } from '../certifications/certification-sources.module.js';
import { EducationSourcesModule } from '../educations/education-sources.module.js';
import { WorkExperienceSourcesModule } from '../work-experience/work-experience-sources.module.js';
import { RadarEvidenceSourcesModule } from '../radar-integration/radar-evidence-sources.module.js';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { SkillAnalysisRepository } from './repositories/skill-analysis.repository.js';
import { SkillAnalysisService } from './services/skill-analysis.service.js';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    CvSourcesModule,
    CertificationSourcesModule,
    EducationSourcesModule,
    WorkExperienceSourcesModule,
    RadarEvidenceSourcesModule,
  ],
  providers: [
    SkillEvidenceSourcesService,
    SkillAnalysisRepository,
    SkillAnalysisService,
  ],
  exports: [SkillAnalysisService],
})
export class SkillAnalysisModule {}
