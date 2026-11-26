import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { JobOffersModule } from '../job-offers/job-offers.module.js';
import { CompaniesController } from './controllers/companies.controller.js';
import { CompaniesRepository } from './repositories/companies.repository.js';
import { CompaniesService } from './services/companies.service.js';

@Module({
  imports: [JwtAuthModule, PrismaModule, JobOffersModule],
  controllers: [CompaniesController],
  providers: [CompaniesService, CompaniesRepository],
})
export class CompaniesModule {}
