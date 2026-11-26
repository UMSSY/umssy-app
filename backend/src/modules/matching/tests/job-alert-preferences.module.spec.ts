import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { PushDispatcherService } from '../../notifications/services/push-dispatcher.service.js';
import { JobAlertPreferencesController } from '../controllers/job-alert-preferences.controller.js';
import { MatchingModule } from '../matching.module.js';
import { JobAlertPreferencesRepository } from '../repositories/job-alert-preferences.repository.js';
import { JobAlertPreferencesService } from '../services/job-alert-preferences.service.js';
import { JobAlertRecipientsService } from '../services/job-alert-recipients.service.js';

describe('MatchingModule: preferencia de avisos de vacantes', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        MatchingModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(PushDispatcherService)
      .useValue({})
      .compile();
  });

  it.each([
    JobAlertPreferencesController,
    JobAlertPreferencesService,
    JobAlertPreferencesRepository,
    JobAlertRecipientsService,
  ])('resuelve %o', (provider) => {
    expect(moduleRef.get(provider)).toBeInstanceOf(provider);
  });
});
