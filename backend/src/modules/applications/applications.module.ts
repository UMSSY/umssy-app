import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { JobOffersModule } from '../job-offers/job-offers.module.js';
import { JobApplicationsService } from './services/job-applications.service.js';

@Module({
  imports: [PrismaModule, JwtAuthModule, JobOffersModule],
  providers: [JobApplicationsService],
  exports: [JobApplicationsService],
})
export class ApplicationsModule {}