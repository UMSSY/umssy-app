import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { MatchingModule } from '../matching/matching.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { JobOffersController } from './controllers/job-offers.controller.js';
import { JobOfferMapper } from './mappers/job-offer.mapper.js';
import { JobOffersRepository } from './repositories/job-offers.repository.js';
import { JobOfferSkillsService } from './services/job-offer-skills.service.js';
import { JobOffersService } from './services/job-offers.service.js';
import { JobRecommendationsService } from './services/job-recommendations.service.js';

@Module({
  imports: [
    PrismaModule,
    SkillsModule,
    forwardRef(() => MatchingModule),
    JwtAuthModule,
  ],
  controllers: [JobOffersController],
  providers: [
    JobOffersService,
    JobOfferSkillsService,
    JobOffersRepository,
    JobOfferMapper,
    JobRecommendationsService,
  ],
  exports: [JobOffersService],
})
export class JobOffersModule {}