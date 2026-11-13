import { ApplicationMapper } from './mappers/application.mapper.js';
import { MatchingModule } from '../matching/matching.module.js';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { Module } from '@nestjs/common';
import { ApplicationsController } from './controllers/applications.controller.js';
import { ApplicationsService } from './services/applications.service.js';
import { ApplicationsRepository } from './repositories/applications.repository.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { MockNotificationsService } from './notifications/mock-notifications.service.js';

@Module({
  imports: [PrismaModule, MatchingModule, JwtAuthModule],
  controllers: [ApplicationsController],
  providers: [
    ApplicationsService,
    ApplicationsRepository,
    ApplicationMapper,
    MockNotificationsService, // <-- Agregado para que NestJS pueda resolverlo en el contenedor
  ],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}