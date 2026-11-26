import { JobOfferMatchRepository } from './repositories/job-offer-match.repository.js';
import { Module, forwardRef } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { MatchingModule } from '../matching/matching.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { JobOffersController } from './controllers/job-offers.controller.js';
import { JobOfferMapper } from './mappers/job-offer.mapper.js';
import { JobOffersRepository } from './repositories/job-offers.repository.js';
import { JobOfferNotificationsService } from './services/job-offer-notifications.service.js';
import { JobOfferSkillsService } from './services/job-offer-skills.service.js';
import { JobOffersService } from './services/job-offers.service.js';
import { JobOfferExpirationScheduler } from './schedulers/job-offer-expiration.scheduler.js';

@Module({
  imports: [
    JwtAuthModule,
    PrismaModule,
    SkillsModule,
    forwardRef(() => MatchingModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [JobOffersController],
  providers: [
    JobOfferMatchRepository,
    JobOffersService,
    JobOfferNotificationsService,
    JobOfferSkillsService,
    JobOffersRepository,
    JobOfferMapper,
    JobOfferExpirationScheduler,
  ],
  exports: [JobOffersService],
})
export class JobOffersModule {}
