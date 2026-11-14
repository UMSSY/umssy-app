import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { UnknownPortfolioProviderException } from '../exceptions/unknown-portfolio-provider.exception.js';
import { UnsupportedPortfolioProviderException } from '../exceptions/unsupported-portfolio-provider.exception.js';
import { PortfolioRepository } from '../repositories/portfolio.repository.js';
import type { NormalizedPortfolioProject } from '../types/normalized-portfolio-project.type.js';
import type { PortfolioProjectEntity } from '../types/portfolio-project-entity.type.js';

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

describe('PortfolioRepository', () => {
  let repository: PortfolioRepository;
  let userPortfolioProject: {
    findMany: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
  };
  let portfolioProvider: {
    findMany: ReturnType<typeof vi.fn>;
  };
  let prisma: {
    userPortfolioProject: typeof userPortfolioProject;
    portfolioProvider: typeof portfolioProvider;
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    userPortfolioProject = {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    };
    portfolioProvider = {
      findMany: vi.fn().mockResolvedValue([
        { id: '11111111-0000-0000-0000-000000000001', name: 'github' },
        { id: '11111111-0000-0000-0000-000000000002', name: 'gitlab' },
      ]),
    };
    prisma = {
      userPortfolioProject,
      portfolioProvider,
      $transaction: vi.fn(
        (callback: (tx: {
          userPortfolioProject: typeof userPortfolioProject;
          portfolioProvider: typeof portfolioProvider;
        }) => Promise<unknown>) =>
          callback({ userPortfolioProject, portfolioProvider }),
      ),
    };
    repository = new PortfolioRepository(prisma as unknown as PrismaService);
  });

  it('finds portfolio projects for a user ordered ascending by displayOrder', async () => {
    const rawRows = [
      {
        id: '22222222-2222-4222-8222-222222222220',
        userId,
        providerId: '11111111-0000-0000-0000-000000000001',
        provider: { name: 'github' },
        repoName: 'owner/repo-0',
        repoUrl: 'https://github.com/owner/repo-0',
        description: 'Project description',
        language: 'TypeScript',
        starsCount: 5,
        isOwner: true,
        displayOrder: 0,
      },
    ];
    userPortfolioProject.findMany.mockResolvedValue(rawRows);

    const result = await repository.findByUserId(userId);

    expect(userPortfolioProject.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        userId: true,
        repoName: true,
        repoUrl: true,
        description: true,
        language: true,
        starsCount: true,
        isOwner: true,
        displayOrder: true,
        provider: { select: { name: true } },
      },
    });
    expect(result).toEqual([
      {
        id: '22222222-2222-4222-8222-222222222220',
        userId,
        provider: 'github',
        repoName: 'owner/repo-0',
        repoUrl: 'https://github.com/owner/repo-0',
        description: 'Project description',
        language: 'TypeScript',
        starsCount: 5,
        isOwner: true,
        displayOrder: 0,
      },
    ]);
  });

  it('replaces user portfolio projects atomically resolving provider catalog IDs', async () => {
    const inputs = [buildNormalized(0), buildNormalized(1)];
    const persisted = [
      {
        id: '22222222-2222-4222-8222-222222222220',
        userId,
        providerId: '11111111-0000-0000-0000-000000000001',
        provider: { name: 'github' },
        repoName: inputs[0].repoName,
        repoUrl: inputs[0].repoUrl,
        description: inputs[0].description,
        language: inputs[0].language,
        starsCount: inputs[0].starsCount,
        isOwner: inputs[0].isOwner,
        displayOrder: 0,
      },
      {
        id: '22222222-2222-4222-8222-222222222221',
        userId,
        providerId: '11111111-0000-0000-0000-000000000002',
        provider: { name: 'gitlab' },
        repoName: inputs[1].repoName,
        repoUrl: inputs[1].repoUrl,
        description: inputs[1].description,
        language: inputs[1].language,
        starsCount: inputs[1].starsCount,
        isOwner: inputs[1].isOwner,
        displayOrder: 1,
      },
    ];
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
        {
          userId,
          providerId: '11111111-0000-0000-0000-000000000001',
          repoName: inputs[0].repoName,
          repoUrl: inputs[0].repoUrl,
          description: inputs[0].description,
          language: inputs[0].language,
          starsCount: inputs[0].starsCount,
          isOwner: inputs[0].isOwner,
          displayOrder: 0,
        },
        {
          userId,
          providerId: '11111111-0000-0000-0000-000000000002',
          repoName: inputs[1].repoName,
          repoUrl: inputs[1].repoUrl,
          description: inputs[1].description,
          language: inputs[1].language,
          starsCount: inputs[1].starsCount,
          isOwner: inputs[1].isOwner,
          displayOrder: 1,
        },
      ],
    });
    expect(result).toHaveLength(2);
    expect(result[0].provider).toBe('github');
    expect(result[1].provider).toBe('gitlab');
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

  it('throws UnsupportedPortfolioProviderException when repository encounters an unsupported provider', async () => {
    userPortfolioProject.findMany.mockResolvedValue([
      {
        id: '22222222-2222-4222-8222-222222222220',
        userId,
        providerId: '11111111-0000-0000-0000-000000000001',
        provider: { name: 'bitbucket' },
        repoName: 'owner/repo-0',
        repoUrl: 'https://bitbucket.org/owner/repo-0',
        description: null,
        language: null,
        starsCount: 0,
        isOwner: true,
        displayOrder: 0,
      },
    ]);

    await expect(repository.findByUserId(userId)).rejects.toThrow(
      UnsupportedPortfolioProviderException,
    );
  });

  it('throws UnknownPortfolioProviderException when provider is not in database catalog', async () => {
    portfolioProvider.findMany.mockResolvedValue([]);

    await expect(
      repository.replaceForUser(userId, [buildNormalized(0)]),
    ).rejects.toThrow(UnknownPortfolioProviderException);
  });
});
