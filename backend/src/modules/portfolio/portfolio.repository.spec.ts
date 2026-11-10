import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../common/prisma/prisma.service.js';
import { PortfolioRepository } from './portfolio.repository.js';
import type {
  NormalizedPortfolioProject,
  PortfolioProjectEntity,
} from './types/portfolio.types.js';

const userId = '11111111-1111-4111-8111-111111111111';

function buildNormalized(displayOrder: number): NormalizedPortfolioProject {
  return {
    provider: displayOrder % 2 === 0 ? 'github' : 'gitlab',
    repoName: `owner/repo-${displayOrder}`,
    repoUrl: `https://github.com/owner/repo-${displayOrder}`,
    description: 'Project description',
    language: 'TypeScript',
    starsCount: 5 + displayOrder,
    isOwner: true,
    displayOrder,
  };
}

function buildEntity(displayOrder: number): PortfolioProjectEntity {
  return {
    id: `22222222-2222-4222-8222-22222222222${displayOrder}`,
    userId,
    ...buildNormalized(displayOrder),
  };
}

describe('PortfolioRepository', () => {
  let repository: PortfolioRepository;
  let userPortfolioProject: {
    findMany: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
  };
  let prisma: {
    userPortfolioProject: typeof userPortfolioProject;
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    userPortfolioProject = {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    };
    prisma = {
      userPortfolioProject,
      $transaction: vi.fn(
        (callback: (tx: { userPortfolioProject: typeof userPortfolioProject }) => Promise<unknown>) =>
          callback({ userPortfolioProject }),
      ),
    };
    repository = new PortfolioRepository(prisma as unknown as PrismaService);
  });

  it('finds portfolio projects for a user ordered ascending by displayOrder', async () => {
    const entities = [buildEntity(0), buildEntity(1)];
    userPortfolioProject.findMany.mockResolvedValue(entities);

    const result = await repository.findByUserId(userId);

    expect(userPortfolioProject.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        userId: true,
        provider: true,
        repoName: true,
        repoUrl: true,
        description: true,
        language: true,
        starsCount: true,
        isOwner: true,
        displayOrder: true,
      },
    });
    expect(result).toEqual(entities);
  });

  it('replaces user portfolio projects atomically inside a Prisma transaction', async () => {
    const inputs = [buildNormalized(0), buildNormalized(1)];
    const persisted = [buildEntity(0), buildEntity(1)];
    userPortfolioProject.deleteMany.mockResolvedValue({ count: 1 });
    userPortfolioProject.createMany.mockResolvedValue({ count: 2 });
    userPortfolioProject.findMany.mockResolvedValue(persisted);

    const result = await repository.replaceForUser(userId, inputs);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(userPortfolioProject.deleteMany).toHaveBeenCalledWith({
      where: { userId },
    });
    expect(userPortfolioProject.createMany).toHaveBeenCalledWith({
      data: [
        { userId, ...inputs[0] },
        { userId, ...inputs[1] },
      ],
    });
    expect(userPortfolioProject.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        userId: true,
        provider: true,
        repoName: true,
        repoUrl: true,
        description: true,
        language: true,
        starsCount: true,
        isOwner: true,
        displayOrder: true,
      },
    });
    expect(result).toEqual(persisted);
  });

  it('deletes existing projects without calling createMany when replacing with an empty list', async () => {
    userPortfolioProject.deleteMany.mockResolvedValue({ count: 2 });
    userPortfolioProject.findMany.mockResolvedValue([]);

    const result = await repository.replaceForUser(userId, []);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(userPortfolioProject.deleteMany).toHaveBeenCalledWith({
      where: { userId },
    });
    expect(userPortfolioProject.createMany).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
