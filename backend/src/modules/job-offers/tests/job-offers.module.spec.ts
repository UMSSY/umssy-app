import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { PushDispatcherService } from '../../notifications/services/push-dispatcher.service.js';
import { JobOffersController } from '../controllers/job-offers.controller.js';
import { JobOffersModule } from '../job-offers.module.js';
import { JobOfferNotificationsService } from '../services/job-offer-notifications.service.js';
import { JobOfferSkillsService } from '../services/job-offer-skills.service.js';
import { JobOffersService } from '../services/job-offers.service.js';

describe('JobOffersModule', () => {
  it('resuelve todas sus dependencias al compilar', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        JobOffersModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(PushDispatcherService)
      .useValue({})
      .compile();

    expect(moduleRef.get(JobOffersController)).toBeDefined();
    expect(moduleRef.get(JobOffersService)).toBeDefined();
    expect(moduleRef.get(JobOfferSkillsService)).toBeDefined();
    expect(moduleRef.get(JobOfferNotificationsService)).toBeDefined();
  });
});
