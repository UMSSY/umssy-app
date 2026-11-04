import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { ProfileSkillsEventsModule } from '../../common/profile-skills/profile-skills-events.module.js';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { NlpModule } from '../nlp/nlp.module.js';
import { RadarPublicationService } from './radar-publication.service.js';
import { RadarCvService } from './radar-cv.service.js';
import { RadarReviewService } from './radar-review.service.js';
import { RadarPdfExtractionService } from './radar-pdf-extraction.service.js';
import { RadarCvRepository } from './repositories/radar-cv.repository.js';
import { RadarReviewRepository } from './repositories/radar-review.repository.js';
import { RadarAccessRepository } from './repositories/radar-access.repository.js';
import { RadarPublicationRepository } from './repositories/radar-publication.repository.js';
import { RadarIntegrationController } from './radar-integration.controller.js';
import { RadarIntegrationService } from './radar-integration.service.js';

@Module({
  imports: [PrismaModule, JwtAuthModule, NlpModule, ProfileSkillsEventsModule],
  controllers: [RadarIntegrationController],
  providers: [
    RadarPublicationRepository, RadarAccessRepository, RadarCvRepository, RadarReviewRepository,
    RadarIntegrationService, RadarPublicationService, RadarCvService, RadarReviewService, RadarPdfExtractionService,
  ],
  exports: [RadarIntegrationService],
})
export class RadarIntegrationModule {}
