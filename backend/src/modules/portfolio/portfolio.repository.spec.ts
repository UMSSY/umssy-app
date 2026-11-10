import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../common/prisma/prisma.service.js';
import { PortfolioRepository } from './portfolio.repository.js';
import type {
  NormalizedPortfolioProject,
  PortfolioPersistenceClient,
  PortfolioProjectEntity,
} from './types/portfolio.types.js';

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '99999999-9999-4999-8999-999999999999';

function buildNormalized(displayOrder: number): NormalizedPortfolioProject {
  return {
    provider: 'github',
    repoName: `owner/repo-${displayOrder}`,
    repoUrl: `https://github.com/owner/repo-${displayOrder}`,
    description: 'Project description',
    language: 'TypeScript',
    starsCount: 5 + displayOrder,
    isOwner: true,
    displayOrder,
  };
}

describe('PortfolioRepository', () => {
  it('uses safe fallback persistence per user when Prisma delegate is not generated yet', async () => {
    const repository = new PortfolioRepository({} as PrismaService);

    expect(await repository.findByUserId(userId)).toEqual([]);

    const saved = await repository.replaceForUser(userId, [
      buildNormalized(1),
      buildNormalized(0),
    ]);

    expect(saved).toHaveLength(2);
    expect(saved[0]?.displayOrder).toBe(0);
    expect(saved[1]?.displayOrder).toBe(1);
    expect(saved[0]?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(await repository.findByUserId(userId)).toEqual(saved);
    expect(await repository.findByUserId(otherUserId)).toEqual([]);

    const replaced = await repository.replaceForUser(userId, [
      buildNormalized(0),
    ]);
    expect(replaced).toHaveLength(1);
    expect(await repository.findByUserId(userId)).toEqual(replaced);
  });

  it('uses Prisma delegate and $transaction atomically when available', async () => {
    const entityOne: PortfolioProjectEntity = {
      id: '22222222-2222-4222-8222-222222222222',
      userId,
      ...buildNormalized(0),
    };
    const delegate = {
      findMany: vi.fn().mockResolvedValue([entityOne]),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      create: vi.fn().mockResolvedValue(entityOne),
    };
    const prismaClient: PortfolioPersistenceClient = {
      portfolioProject: delegate,
      $transaction: vi.fn(
        (callback: (tx: PortfolioPersistenceClient) => Promise<unknown>) =>
          callback({ portfolioProject: delegate }),
      ),
    };
    const repository = new PortfolioRepository(
      prismaClient as unknown as PrismaService,
    );

    const found = await repository.findByUserId(userId);
    expect(found).toEqual([entityOne]);
    expect(delegate.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { displayOrder: 'asc' },
    });

    const saved = await repository.replaceForUser(userId, [buildNormalized(0)]);
    expect(prismaClient.$transaction).toHaveBeenCalledTimes(1);
    expect(delegate.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(delegate.create).toHaveBeenCalledWith({
      data: { userId, ...buildNormalized(0) },
    });
    expect(saved).toEqual([entityOne]);
  });

  it('uses delegate directly when $transaction is absent and handles tx without delegate', async () => {
    const entity: PortfolioProjectEntity = {
      id: '33333333-3333-4333-8333-333333333333',
      userId,
      ...buildNormalized(0),
    };
    const delegate = {
      findMany: vi.fn().mockResolvedValue([entity]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue(entity),
    };

    const repoWithoutTx = new PortfolioRepository({
      portfolioProject: delegate,
    } as unknown as PrismaService);

    expect(
      await repoWithoutTx.replaceForUser(userId, [buildNormalized(0)]),
    ).toEqual([entity]);
    expect(delegate.deleteMany).toHaveBeenCalledTimes(1);

    const repoWithEmptyTx = new PortfolioRepository({
      portfolioProject: delegate,
      $transaction: vi.fn(
        (callback: (tx: PortfolioPersistenceClient) => Promise<unknown>) =>
          callback({}),
      ),
    } as unknown as PrismaService);

    expect(
      await repoWithEmptyTx.replaceForUser(userId, [buildNormalized(0)]),
    ).toEqual([entity]);
    expect(delegate.deleteMany).toHaveBeenCalledTimes(2);
  });
});

