import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApplicationMapper } from './mappers/application.mapper.js';
import { MatchingModule } from '../matching/matching.module.js';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { ApplicationsController } from './controllers/applications.controller.js';
import { ApplicationsService } from './services/applications.service.js';
import { ApplicationsRepository } from './repositories/applications.repository.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { JobOffersModule } from '../job-offers/job-offers.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    forwardRef(() => MatchingModule),
    JwtAuthModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => JobOffersModule),
    UsersModule,
  ],
  controllers: [ApplicationsController],
  providers: [
    ApplicationsService,
    ApplicationsRepository,
    ApplicationMapper,
  ],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
