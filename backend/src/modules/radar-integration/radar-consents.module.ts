import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { RadarApplicationsRepository } from './repositories/radar-applications.repository.js';
import { RadarApplicationConsentsService } from './services/radar-application-consents.service.js';

@Module({
  imports: [PrismaModule],
  providers: [RadarApplicationsRepository, RadarApplicationConsentsService],
  exports: [RadarApplicationsRepository, RadarApplicationConsentsService],
})
export class RadarConsentsModule {}
