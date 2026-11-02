import { beforeEach, describe, expect, it } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { JobMatchController } from '../controllers/job-match.controller.js';
import { MatchingModule } from '../matching.module.js';
import { JobMatchRepository } from '../repositories/job-match.repository.js';
import { JobMatchService } from '../services/job-match.service.js';
 
describe('MatchingModule: endpoint de afinidad por vacante', () => {
  let moduleRef: TestingModule;
 
  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MatchingModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
  });
 
  it.each([JobMatchController, JobMatchService, JobMatchRepository])(
    'resuelve %o',
    (provider) => {
      expect(moduleRef.get(provider)).toBeInstanceOf(provider);
    },
  );
});
