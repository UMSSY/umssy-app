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

import { MatchingModule } from '../matching/matching.module.js';
import { RadarRecruitmentController } from './controllers/radar-recruitment.controller.js';
import { RadarRecruitmentService } from './radar-recruitment.service.js';
import { RadarRecruitmentRepository } from './repositories/radar-recruitment.repository.js';
import { RadarApplicationsRepository } from './repositories/radar-applications.repository.js';

import { DocumentOcrModule } from '../access-requests/document-ocr.module.js';
import { DocumentVerificationRepository } from './repositories/document-verification.repository.js';
import { DocumentVerificationService } from './services/document-verification.service.js';
import { DocumentVerificationController } from './controllers/document-verification.controller.js';
@Module({
  imports: [
    DocumentOcrModule,
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
    MatchingModule,
  ],
  controllers: [DocumentVerificationController, RadarIntegrationController, RadarRecruitmentController],
  providers: [
    DocumentVerificationRepository, DocumentVerificationService,
    RadarPublicationRepository,
    RadarRecruitmentRepository,
    RadarApplicationsRepository,
    RadarAccessRepository,
    RadarCvRepository,
    RadarReviewRepository,
    RadarIntegrationService,
    RadarRecruitmentService,
    RadarPublicationService,
    RadarPublicationMapper,
    RadarPublicationEvidenceService,
    RadarCvService,
    RadarReviewService,
    RadarReviewMapper,
    RadarPdfExtractionService,
  ],
  exports: [RadarIntegrationService, RadarRecruitmentService],
})
export class RadarIntegrationModule {}
