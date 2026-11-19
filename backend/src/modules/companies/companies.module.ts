import { Module } from '@nestjs/common';
import { CompaniesController } from './controllers/companies.controller.js';
import { CompaniesService } from './services/companies.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, PrismaService],
  exports: [CompaniesService],
})
export class CompaniesModule {}