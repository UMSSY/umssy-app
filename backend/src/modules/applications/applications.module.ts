import { Module } from '@nestjs/common';
import { ApplicationsController } from './controllers/applications.controller.js'; 
import { ApplicationsService } from './services/applications.service.js';         
import { ApplicationsRepository } from './repositories/applications.repository.js'; 
import { PrismaModule } from '../../common/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsRepository],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}