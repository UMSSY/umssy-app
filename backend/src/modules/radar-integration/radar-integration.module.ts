import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { RadarIntegrationController } from './radar-integration.controller.js';
import { RadarPublicationService } from './radar-publication.service.js';
import { RadarRecruitmentService } from './radar-recruitment.service.js';
import { RadarAccessRepository } from './repositories/radar-access.repository.js';
import { RadarApplicationsRepository } from './repositories/radar-applications.repository.js';
import { RadarPublicationRepository } from './repositories/radar-publication.repository.js';
import { RadarRecruitmentRepository } from './repositories/radar-recruitment.repository.js';

@Module({
  imports: [PrismaModule, JwtAuthModule],
  controllers: [RadarIntegrationController],
  providers: [
    RadarAccessRepository,
    RadarApplicationsRepository,
    RadarPublicationRepository,
    RadarRecruitmentRepository,
    RadarPublicationService,
    RadarRecruitmentService,
  ],
  exports: [RadarPublicationService, RadarRecruitmentService],
})
export class RadarIntegrationModule {}
