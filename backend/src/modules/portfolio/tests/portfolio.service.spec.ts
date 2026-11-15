import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DuplicatePortfolioProjectException } from '../exceptions/duplicate-portfolio-project.exception.js';
import { MaxPortfolioProjectsExceededException } from '../exceptions/max-portfolio-projects-exceeded.exception.js';
import { PortfolioProjectMapper } from '../mappers/portfolio-project.mapper.js';
import type { PortfolioRepository } from '../repositories/portfolio.repository.js';
import type { SocialAccountRepository } from '../repositories/social-account.repository.js';
import type { PortfolioProjectItemRequest } from '../requests/update-portfolio-projects.schema.js';
import type { ExternalRepositoryResponse } from '../responses/external-repository.response.js';
import type { ProviderRepositoriesService } from '../services/provider-repositories.service.js';
import { PortfolioService } from '../services/portfolio.service.js';
import type { PortfolioProjectEntity } from '../types/portfolio-project-entity.type.js';
import type { PortfolioProvider } from '../types/portfolio-provider.type.js';
import type { SocialAccountEntity } from '../types/social-account-entity.type.js';

const userId = '11111111-1111-4111-8111-111111111111';

function buildInput(
  overrides: Partial<PortfolioProjectItemRequest> = {},
): PortfolioProjectItemRequest {
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
  let socialAccountRepository: {
    findByUserId: ReturnType<typeof vi.fn>;
    upsertAccount: ReturnType<typeof vi.fn>;
  };
  let providerRepositoriesService: {
    fetchGitHubRepositories: ReturnType<typeof vi.fn>;
    fetchGitLabRepositories: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    repository = {
      findByUserId: vi.fn(),
      replaceForUser: vi.fn(),
    };
    socialAccountRepository = {
      findByUserId: vi.fn(),
      upsertAccount: vi.fn(),
    };
    providerRepositoriesService = {
      fetchGitHubRepositories: vi.fn(),
      fetchGitLabRepositories: vi.fn(),
    };

    service = new PortfolioService(
      repository as unknown as PortfolioRepository,
      new PortfolioProjectMapper(),
      socialAccountRepository as unknown as SocialAccountRepository,
      providerRepositoriesService as unknown as ProviderRepositoriesService,
    );
  });

  describe('projects', () => {
    it('returns saved portfolio projects ordered ascending by displayOrder', async () => {
      const entities: PortfolioProjectEntity[] = [
        {
          id: '22222222-2222-4222-8222-222222222222',
          userId,
          provider: 'gitlab',
          repoName: 'backend',
          repoUrl: 'https://gitlab.com/umssy/backend',
          description: null,
          language: null,
          starsCount: 0,
          isOwner: true,
          displayOrder: 0,
        },
      ];
      repository.findByUserId.mockResolvedValue(entities);

      const result = await service.getProjects(userId);

      expect(result).toEqual([
        {
          id: '22222222-2222-4222-8222-222222222222',
          provider: 'gitlab',
          repoName: 'backend',
          repoUrl: 'https://gitlab.com/umssy/backend',
          description: null,
          language: null,
          starsCount: 0,
          isOwner: true,
          displayOrder: 0,
        },
      ]);
      expect(repository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('normalizes, validates, and persists portfolio projects', async () => {
      const inputs = [
        buildInput({
          repoName: '  umssy/umssy-app  ',
          repoUrl: ' https://github.com/umssy/umssy-app ',
          description: '  Plataforma  ',
        }),
        buildInput({
          provider: 'gitlab',
          repoName: 'umssy/docs',
          repoUrl: 'https://gitlab.com/umssy/docs',
          description: '   ',
          language: undefined,
        }),
      ];

      repository.replaceForUser.mockResolvedValue([
        {
          id: '22222222-2222-4222-8222-222222222222',
          userId,
          provider: 'github',
          repoName: 'umssy/umssy-app',
          repoUrl: 'https://github.com/umssy/umssy-app',
          description: 'Plataforma',
          language: 'TypeScript',
          starsCount: 12,
          isOwner: true,
          displayOrder: 0,
        },
        {
          id: '33333333-3333-4333-8333-333333333333',
          userId,
          provider: 'gitlab',
          repoName: 'umssy/docs',
          repoUrl: 'https://gitlab.com/umssy/docs',
          description: null,
          language: null,
          starsCount: 12,
          isOwner: true,
          displayOrder: 1,
        },
      ]);

      const result = await service.updateProjects(userId, inputs);

      expect(result).toHaveLength(2);
      expect(repository.replaceForUser).toHaveBeenCalledWith(userId, [
        {
          provider: 'github',
          repoName: 'umssy/umssy-app',
          repoUrl: 'https://github.com/umssy/umssy-app',
          description: 'Plataforma',
          language: 'TypeScript',
          starsCount: 12,
          isOwner: true,
          displayOrder: 0,
        },
        {
          provider: 'gitlab',
          repoName: 'umssy/docs',
          repoUrl: 'https://gitlab.com/umssy/docs',
          description: null,
          language: null,
          starsCount: 12,
          isOwner: true,
          displayOrder: 1,
        },
      ]);
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

  describe('getAccounts', () => {
    it('returns connection status for all supported portfolio providers', async () => {
      const mockAccounts: SocialAccountEntity[] = [
        {
          id: 'acc-1',
          userId,
          provider: 'github',
          externalId: '123',
          username: 'octocat',
          profileUrl: 'https://github.com/octocat',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      socialAccountRepository.findByUserId.mockResolvedValue(mockAccounts);

      const result = await service.getAccounts(userId);

      expect(result).toEqual([
        {
          provider: 'github',
          connected: true,
          username: 'octocat',
          profileUrl: 'https://github.com/octocat',
        },
        {
          provider: 'gitlab',
          connected: false,
          username: null,
          profileUrl: null,
        },
      ]);
    });
  });

  describe('getRepositories', () => {
    it('returns empty array if user has no connected social accounts', async () => {
      socialAccountRepository.findByUserId.mockResolvedValue([]);

      const result = await service.getRepositories(userId);

      expect(result).toEqual([]);
      expect(providerRepositoriesService.fetchGitHubRepositories).not.toHaveBeenCalled();
      expect(providerRepositoriesService.fetchGitLabRepositories).not.toHaveBeenCalled();
    });

    it('returns empty array if requested provider is not connected', async () => {
      socialAccountRepository.findByUserId.mockResolvedValue([
        {
          id: 'acc-1',
          userId,
          provider: 'github',
          externalId: '123',
          username: 'octocat',
          profileUrl: 'https://github.com/octocat',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getRepositories(userId, { provider: 'gitlab' });

      expect(result).toEqual([]);
      expect(providerRepositoriesService.fetchGitLabRepositories).not.toHaveBeenCalled();
    });

    it('fetches repositories from connected accounts, filters by search, and sorts descending by updatedAt', async () => {
      socialAccountRepository.findByUserId.mockResolvedValue([
        {
          id: 'acc-gh',
          userId,
          provider: 'github',
          externalId: '123',
          username: 'octocat',
          profileUrl: 'https://github.com/octocat',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'acc-gl',
          userId,
          provider: 'gitlab',
          externalId: '456',
          username: 'gluser',
          profileUrl: 'https://gitlab.com/gluser',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const githubRepos: ExternalRepositoryResponse[] = [
        {
          provider: 'github',
          repoName: 'umssy-app',
          repoUrl: 'https://github.com/octocat/umssy-app',
          description: 'Frontend and backend monorepo',
          language: 'TypeScript',
          starsCount: 20,
          isOwner: true,
          updatedAt: '2026-11-10T10:00:00.000Z',
        },
        {
          provider: 'github',
          repoName: 'other-repo',
          repoUrl: 'https://github.com/octocat/other-repo',
          description: 'Unrelated code',
          language: 'Python',
          starsCount: 2,
          isOwner: true,
          updatedAt: '2026-11-08T10:00:00.000Z',
        },
      ];

      const gitlabRepos: ExternalRepositoryResponse[] = [
        {
          provider: 'gitlab',
          repoName: 'umssy-docs',
          repoUrl: 'https://gitlab.com/gluser/umssy-docs',
          description: 'Documentation project',
          language: null,
          starsCount: 5,
          isOwner: true,
          updatedAt: '2026-11-12T15:00:00.000Z',
        },
      ];

      providerRepositoriesService.fetchGitHubRepositories.mockResolvedValue(githubRepos);
      providerRepositoriesService.fetchGitLabRepositories.mockResolvedValue(gitlabRepos);

      const result = await service.getRepositories(userId, { search: 'monorepo' });

      expect(result).toHaveLength(1);
      expect(result[0]?.repoName).toBe('umssy-app');
    });

    it('returns all repositories when no search filter is provided and ignores unknown provider accounts', async () => {
      socialAccountRepository.findByUserId.mockResolvedValue([
        {
          id: 'acc-unknown',
          userId,
          provider: 'unknown' as unknown as PortfolioProvider,
          externalId: '000',
          username: 'unknownuser',
          profileUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'acc-gh',
          userId,
          provider: 'github',
          externalId: '123',
          username: 'octocat',
          profileUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      providerRepositoriesService.fetchGitHubRepositories.mockResolvedValue([
        {
          provider: 'github',
          repoName: 'my-repo',
          repoUrl: 'https://github.com/octocat/my-repo',
          description: null,
          language: null,
          starsCount: 0,
          isOwner: true,
          updatedAt: '2026-11-01T00:00:00.000Z',
        },
      ]);

      const result = await service.getRepositories(userId);
      expect(result).toHaveLength(1);
      expect(result[0]?.repoName).toBe('my-repo');
    });
  });
});
