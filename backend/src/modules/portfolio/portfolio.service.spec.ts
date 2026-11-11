import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DuplicatePortfolioProjectException,
  MaxPortfolioProjectsExceededException,
} from './exceptions/portfolio.exceptions.js';
import { PortfolioProjectMapper } from './mappers/portfolio-project.mapper.js';
import type { PortfolioRepository } from './portfolio.repository.js';
import { PortfolioService } from './portfolio.service.js';
import type {
  PortfolioProjectEntity,
  PortfolioProjectInput,
} from './types/portfolio.types.js';

const userId = '11111111-1111-4111-8111-111111111111';

function buildInput(
  overrides: Partial<PortfolioProjectInput> = {},
): PortfolioProjectInput {
  return {
    provider: 'github',
    repoName: 'umssy/umssy-app',
    repoUrl: 'https://github.com/umssy/umssy-app',
    description: 'Plataforma UMSSY',
    language: 'TypeScript',
    starsCount: 12,
    isOwner: true,
    ...overrides,
  };
}

describe('PortfolioService', () => {
  let service: PortfolioService;
  let repository: {
    findByUserId: ReturnType<typeof vi.fn>;
    replaceForUser: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    repository = {
      findByUserId: vi.fn(),
      replaceForUser: vi.fn(),
    };
    service = new PortfolioService(
      repository as unknown as PortfolioRepository,
      new PortfolioProjectMapper(),
    );
  });

  it('returns saved portfolio projects ordered ascending by displayOrder', async () => {
    const entities: PortfolioProjectEntity[] = [
      {
        id: '22222222-2222-4222-8222-222222222222',
        userId,
        provider: 'gitlab',
        repoName: 'grupo-2/api',
        repoUrl: 'https://gitlab.com/grupo-2/api',
        description: null,
        language: 'TypeScript',
        starsCount: 3,
        isOwner: false,
        displayOrder: 1,
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        userId,
        provider: 'github',
        repoName: 'umssy/umssy-app',
        repoUrl: 'https://github.com/umssy/umssy-app',
        description: 'Plataforma UMSSY',
        language: 'TypeScript',
        starsCount: 15,
        isOwner: true,
        displayOrder: 0,
      },
    ];
    repository.findByUserId.mockResolvedValue(entities);

    const result = await service.getProjects(userId);

    expect(repository.findByUserId).toHaveBeenCalledWith(userId);
    expect(result.map((item) => item.displayOrder)).toEqual([0, 1]);
    expect(result[0]?.repoName).toBe('umssy/umssy-app');
    expect(result[1]?.repoName).toBe('grupo-2/api');
  });

  it('saves up to 6 projects, normalizes fields, and assigns displayOrder 0 to 5', async () => {
    const inputs: PortfolioProjectInput[] = Array.from(
      { length: 6 },
      (_, index) =>
        buildInput({
          provider: index % 2 === 0 ? 'github' : 'gitlab',
          repoName: `  owner/repo-${index}  `,
          repoUrl: ` https://github.com/owner/repo-${index} `,
          description: index === 0 ? '   ' : `Desc ${index}`,
          language: index === 1 ? undefined : 'TypeScript',
          starsCount: index * 2,
          isOwner: index % 2 === 0,
        }),
    );

    repository.replaceForUser.mockImplementation(
      (
        _uid: string,
        normalized: Array<
          PortfolioProjectInput & {
            description: string | null;
            language: string | null;
            displayOrder: number;
          }
        >,
      ) =>
        Promise.resolve(
          normalized.map((item, idx) => ({
            id: `00000000-0000-4000-8000-00000000000${idx}`,
            userId,
            ...item,
          })),
        ),
    );

    const result = await service.updateProjects(userId, inputs);

    expect(repository.replaceForUser).toHaveBeenCalledTimes(1);
    const savedPayload = repository.replaceForUser.mock.calls[0]?.[1] as Array<{
      repoName: string;
      repoUrl: string;
      description: string | null;
      language: string | null;
      displayOrder: number;
    }>;
    expect(savedPayload.map((item) => item.displayOrder)).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
    expect(savedPayload[0]?.repoName).toBe('owner/repo-0');
    expect(savedPayload[0]?.repoUrl).toBe('https://github.com/owner/repo-0');
    expect(savedPayload[0]?.description).toBeNull();
    expect(savedPayload[1]?.language).toBeNull();
    expect(result).toHaveLength(6);
    expect(result.map((item) => item.displayOrder)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('allows clearing all portfolio projects with an empty array', async () => {
    repository.replaceForUser.mockResolvedValue([]);

    const result = await service.updateProjects(userId, []);

    expect(repository.replaceForUser).toHaveBeenCalledWith(userId, []);
    expect(result).toEqual([]);
  });

  it('throws MaxPortfolioProjectsExceededException when more than 6 projects are provided', async () => {
    const inputs = Array.from({ length: 7 }, (_, index) =>
      buildInput({
        repoName: `owner/repo-${index}`,
        repoUrl: `https://github.com/owner/repo-${index}`,
      }),
    );

    await expect(service.updateProjects(userId, inputs)).rejects.toBeInstanceOf(
      MaxPortfolioProjectsExceededException,
    );
    expect(repository.replaceForUser).not.toHaveBeenCalled();
  });

  it('throws DuplicatePortfolioProjectException for duplicate provider and repoName ignoring case and whitespace', async () => {
    const inputs = [
      buildInput({
        provider: 'github',
        repoName: 'Octocat/Hello-World',
      }),
      buildInput({
        provider: 'github',
        repoName: '  octocat/hello-world ',
      }),
    ];

    await expect(service.updateProjects(userId, inputs)).rejects.toBeInstanceOf(
      DuplicatePortfolioProjectException,
    );
    expect(repository.replaceForUser).not.toHaveBeenCalled();
  });

  it('allows the same repoName across different providers', async () => {
    const inputs = [
      buildInput({
        provider: 'github',
        repoName: 'shared/project',
        repoUrl: 'https://github.com/shared/project',
      }),
      buildInput({
        provider: 'gitlab',
        repoName: 'shared/project',
        repoUrl: 'https://gitlab.com/shared/project',
      }),
    ];

    repository.replaceForUser.mockResolvedValue(
      inputs.map((item, idx) => ({
        id: `00000000-0000-4000-8000-00000000001${idx}`,
        userId,
        description: item.description ?? null,
        language: item.language ?? null,
        provider: item.provider,
        repoName: item.repoName,
        repoUrl: item.repoUrl,
        starsCount: item.starsCount,
        isOwner: item.isOwner,
        displayOrder: idx,
      })),
    );

    const result = await service.updateProjects(userId, inputs);

    expect(result).toHaveLength(2);
    expect(repository.replaceForUser).toHaveBeenCalledTimes(1);
  });
});

