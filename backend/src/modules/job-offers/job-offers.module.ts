import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { MatchingModule } from '../matching/matching.module.js';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { JobOffersController } from './job-offers.controller.js';
import { JobOffersService } from './services/job-offers.service.js';
import { JobOfferSkillsService } from './services/job-offer-skills.service.js';
import { JobOffersRepository } from './repositories/job-offers.repository.js';
import { JobOfferMapper } from './mappers/job-offer.mapper.js';
import { JobMatchingService } from './services/job-matching.service.js';

@Module({
  imports: [
    PrismaModule,
    SkillsModule,
    MatchingModule,
    JwtAuthModule,
  ],
  controllers: [JobOffersController],
  providers: [
    JobOffersService,
    JobOfferSkillsService,
    JobOffersRepository,
    JobOfferMapper,
    JobMatchingService,
  ],
  exports: [JobOffersService],
})
export class JobOffersModule {}
