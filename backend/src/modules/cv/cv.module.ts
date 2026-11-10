import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { FileValidationService } from '../../common/services/file-validation.service.js';
import { CvFileController } from './controllers/cv-file.controller.js';
import { CvGenerateController } from './controllers/cv-generate.controller.js';
import { CvHistoryController } from './controllers/cv-history.controller.js';
import { CvMapper } from './mappers/cv.mapper.js';
import { CvSourcesModule } from './cv-sources.module.js';
import { CvMetadataRepository } from './repositories/cv-metadata.repository.js';
import { CvGenerationService } from './services/cv-generation.service.js';
import { CvPdfGeneratorService } from './services/cv-pdf-generator.service.js';
import { CvService } from './services/cv.service.js';
import { RadarIntegrationModule } from '../radar-integration/radar-integration.module.js';
import { ProfileModule } from '../profile/profile.module.js';
import { EducationsModule } from '../educations/educations.module.js';
import { WorkExperienceModule } from '../work-experience/work-experience.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { CertificationSourcesModule } from '../certifications/certification-sources.module.js';

@Module({
  imports: [
    CvSourcesModule,
    PrismaModule,
    JwtAuthModule,
    RadarIntegrationModule,
    ProfileModule,
    EducationsModule,
    WorkExperienceModule,
    SkillsModule,
    CertificationSourcesModule,
  ],
  controllers: [CvHistoryController, CvFileController, CvGenerateController],
  providers: [
    CvService,
    CvMetadataRepository,
    CvMapper,
    FileValidationService,
    CvPdfGeneratorService,
    CvGenerationService,
  ],
  exports: [CvService, CvPdfGeneratorService, CvGenerationService],
})
export class CvModule {}
