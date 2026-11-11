import { CvSourcesModule } from '../cv/cv-sources.module.js';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { ProfileSkillsEventsModule } from '../../common/profile-skills/profile-skills-events.module.js';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { NlpModule } from '../nlp/nlp.module.js';
import { SkillAnalysisModule } from '../skills/skill-analysis.module.js';
import { WorkExperienceSourcesModule } from '../work-experience/work-experience-sources.module.js';
import { EducationSourcesModule } from '../educations/education-sources.module.js';
import { CertificationSourcesModule } from '../certifications/certification-sources.module.js';
import { RadarEvidenceSourcesModule } from './radar-evidence-sources.module.js';
import { RadarPublicationEvidenceService } from './services/radar-publication-evidence.service.js';
import { RadarPublicationService } from './services/radar-publication.service.js';
import { RadarPublicationMapper } from './mappers/radar-publication.mapper.js';
import { RadarReviewMapper } from './mappers/radar-review.mapper.js';
import { RadarCvService } from './services/radar-cv.service.js';
import { RadarReviewService } from './services/radar-review.service.js';
import { RadarPdfExtractionService } from './services/radar-pdf-extraction.service.js';
import { RadarCvRepository } from './repositories/radar-cv.repository.js';
import { RadarReviewRepository } from './repositories/radar-review.repository.js';
import { RadarAccessRepository } from './repositories/radar-access.repository.js';
import { RadarPublicationRepository } from './repositories/radar-publication.repository.js';
import { RadarIntegrationController } from './controllers/radar-integration.controller.js';
import { RadarIntegrationService } from './services/radar-integration.service.js';

@Module({
  imports: [
    CvSourcesModule,
    PrismaModule,
    JwtAuthModule,
    NlpModule,
    ProfileSkillsEventsModule,
    SkillAnalysisModule,
    WorkExperienceSourcesModule,
    EducationSourcesModule,
    CertificationSourcesModule,
    RadarEvidenceSourcesModule,
  ],
  controllers: [RadarIntegrationController],
  providers: [
    RadarPublicationRepository,
    RadarAccessRepository,
    RadarCvRepository,
    RadarReviewRepository,
    RadarIntegrationService,
    RadarPublicationService,
    RadarPublicationMapper,
    RadarPublicationEvidenceService,
    RadarCvService,
    RadarReviewService,
    RadarReviewMapper,
    RadarPdfExtractionService,
  ],
  exports: [RadarIntegrationService, RadarPdfExtractionService],
})
export class RadarIntegrationModule {}
