import { beforeEach, describe, expect, it } from 'vitest';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { PushDispatcherService } from '../../notifications/services/push-dispatcher.service.js';
import { JobMatchController } from '../controllers/job-match.controller.js';
import { MatchingModule } from '../matching.module.js';
import { JobMatchSourceService } from '../services/job-match-source.service.js';
import { JobMatchService } from '../services/job-match.service.js';

describe('MatchingModule: endpoint de afinidad por vacante', () => {
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

  it.each([JobMatchController, JobMatchService, JobMatchSourceService])(
    'resuelve %o',
    (provider) => {
      expect(moduleRef.get(provider)).toBeInstanceOf(provider);
    },
  );
});
