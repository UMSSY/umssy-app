import { beforeEach, describe, expect, it } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../../common/prisma/prisma.module.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { PortfolioController } from '../controllers/portfolio.controller.js';
import { PortfolioProjectMapper } from '../mappers/portfolio-project.mapper.js';
import { PortfolioModule } from '../portfolio.module.js';
import { PortfolioRepository } from '../repositories/portfolio.repository.js';
import { PortfolioService } from '../services/portfolio.service.js';

describe('PortfolioModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PortfolioModule, PrismaModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
  });

  it.each([
    PortfolioController,
    PortfolioService,
    PortfolioRepository,
    PortfolioProjectMapper,
  ])('provides %p', (token) => {
    expect(moduleRef.get(token)).toBeDefined();
  });
});
