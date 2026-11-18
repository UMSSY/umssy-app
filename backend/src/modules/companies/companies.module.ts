import { Module } from '@nestjs/common';
import { CompaniesController } from './controllers/companies.controller.js';
import { CompaniesService } from './services/companies.service.js';
import { CompaniesRepository } from './repositories/companies.repository.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [CompaniesController],
  providers: [CompaniesService, CompaniesRepository],
  exports: [CompaniesService],
})
export class CompaniesModule {}