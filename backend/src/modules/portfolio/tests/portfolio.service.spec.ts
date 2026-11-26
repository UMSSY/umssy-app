import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DuplicatePortfolioProjectException } from '../exceptions/duplicate-portfolio-project.exception.js';
import { ExternalProviderUnavailableException } from '../exceptions/external-provider-unavailable.exception.js';
import { MaxPortfolioProjectsExceededException } from '../exceptions/max-portfolio-projects-exceeded.exception.js';
import { SocialAccountMapper } from '../mappers/social-account.mapper.js';
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
    syncMetadataForUser: ReturnType<typeof vi.fn>;
  };
  let socialAccountRepository: {
    findByUserId: ReturnType<typeof vi.fn>;
    upsertAccount: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };
  let providerRepositoriesService: {
    fetchGitHubRepository: ReturnType<typeof vi.fn>;
    fetchGitLabRepository: ReturnType<typeof vi.fn>;
    fetchGitHubRepositories: ReturnType<typeof vi.fn>;
    fetchGitLabRepositories: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    repository = {
      findByUserId: vi.fn(),
      replaceForUser: vi.fn(),
      syncMetadataForUser: vi.fn(),
    };
    socialAccountRepository = {
      findByUserId: vi.fn(),
      upsertAccount: vi.fn(),
      disconnect: vi.fn(),
    };
    providerRepositoriesService = {
      fetchGitHubRepository: vi.fn(),
      fetchGitLabRepository: vi.fn(),
      fetchGitHubRepositories: vi.fn(),
      fetchGitLabRepositories: vi.fn(),
    };

    service = new PortfolioService(
      repository as unknown as PortfolioRepository,
      new PortfolioProjectMapper(),
      socialAccountRepository as unknown as SocialAccountRepository,
      providerRepositoriesService as unknown as ProviderRepositoriesService,
      new SocialAccountMapper(),
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

      await expect(
        service.updateProjects(userId, inputs),
      ).rejects.toBeInstanceOf(MaxPortfolioProjectsExceededException);
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

      await expect(
        service.updateProjects(userId, inputs),
      ).rejects.toBeInstanceOf(DuplicatePortfolioProjectException);
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
      expect(
        providerRepositoriesService.fetchGitHubRepositories,
      ).not.toHaveBeenCalled();
      expect(
        providerRepositoriesService.fetchGitLabRepositories,
      ).not.toHaveBeenCalled();
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

      const result = await service.getRepositories(userId, {
        provider: 'gitlab',
      });

      expect(result).toEqual([]);
      expect(
        providerRepositoriesService.fetchGitLabRepositories,
      ).not.toHaveBeenCalled();
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

      providerRepositoriesService.fetchGitHubRepositories.mockResolvedValue(
        githubRepos,
      );
      providerRepositoriesService.fetchGitLabRepositories.mockResolvedValue(
        gitlabRepos,
      );

      const result = await service.getRepositories(userId, {
        search: 'monorepo',
      });

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

  describe('disconnectSocialAccount', () => {
    it('calls socialAccountRepository.disconnect and returns disconnected status', async () => {
      socialAccountRepository.disconnect.mockResolvedValue(undefined);

      const result = await service.disconnectSocialAccount(userId, 'github');

      expect(socialAccountRepository.disconnect).toHaveBeenCalledWith(
        userId,
        'github',
      );
      expect(result).toEqual({
        provider: 'github',
        connected: false,
      });
    });
  });

  describe('syncProjects', () => {
    const saved = (
      id: string,
      provider: PortfolioProvider = 'github',
      repoUrl = `https://github.com/owner/${id}`,
    ): PortfolioProjectEntity => ({
      id,
      userId,
      provider,
      repoName: id,
      repoUrl,
      description: 'Saved description',
      language: 'TypeScript',
      starsCount: 1,
      isOwner: false,
      displayOrder: 4,
    });
    const account = (provider: PortfolioProvider): SocialAccountEntity => ({
      id: `account-${provider}`,
      userId,
      provider,
      externalId: '123',
      username: 'owner',
      profileUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const remote = (
      project: PortfolioProjectEntity,
    ): ExternalRepositoryResponse => ({
      ...project,
      starsCount: 20,
      description: ' Updated ',
      updatedAt: '2026-11-16T00:00:00Z',
    });

    it('does not query providers or write when the selection is empty', async () => {
      repository.findByUserId.mockResolvedValue([]);
      await expect(service.syncProjects(userId)).resolves.toEqual([]);
      expect(socialAccountRepository.findByUserId).not.toHaveBeenCalled();
      expect(repository.syncMetadataForUser).not.toHaveBeenCalled();
    });

    it('queries selected URLs directly and preserves IDs, ordering and inaccessible projects', async () => {
      const first = saved('app', 'github', 'https://github.com/team-one/app');
      const missing = { ...saved('uncertain'), displayOrder: 8 };
      const gitlab = {
        ...saved('app', 'gitlab', 'https://gitlab.com/group/subgroup/app'),
        id: 'gl-id',
        displayOrder: 10,
      };
      repository.findByUserId.mockResolvedValue([first, missing, gitlab]);
      socialAccountRepository.findByUserId.mockResolvedValue([
        account('github'),
        account('gitlab'),
      ]);
      providerRepositoriesService.fetchGitHubRepository.mockImplementation(
        async (url: string) => (url === first.repoUrl ? remote(first) : null),
      );
      providerRepositoriesService.fetchGitLabRepository.mockResolvedValue(
        remote(gitlab),
      );
      repository.syncMetadataForUser.mockResolvedValue([
        { ...first, description: 'Updated', starsCount: 20 },
        missing,
        { ...gitlab, description: 'Updated', starsCount: 20 },
      ]);

      const result = await service.syncProjects(userId);
      expect(
        providerRepositoriesService.fetchGitHubRepository,
      ).toHaveBeenCalledWith(first.repoUrl, 'owner');
      expect(
        providerRepositoriesService.fetchGitHubRepository,
      ).toHaveBeenCalledWith(missing.repoUrl, 'owner');
      expect(
        providerRepositoriesService.fetchGitLabRepository,
      ).toHaveBeenCalledWith(gitlab.repoUrl, 'owner');
      expect(
        providerRepositoriesService.fetchGitHubRepositories,
      ).not.toHaveBeenCalled();
      expect(
        providerRepositoriesService.fetchGitLabRepositories,
      ).not.toHaveBeenCalled();
      expect(repository.replaceForUser).not.toHaveBeenCalled();
      expect(repository.syncMetadataForUser).toHaveBeenCalledWith(userId, [
        {
          id: first.id,
          repoName: first.repoName,
          repoUrl: first.repoUrl,
          description: 'Updated',
          language: 'TypeScript',
          starsCount: 20,
          isOwner: false,
        },
        {
          id: gitlab.id,
          repoName: gitlab.repoName,
          repoUrl: gitlab.repoUrl,
          description: 'Updated',
          language: 'TypeScript',
          starsCount: 20,
          isOwner: false,
        },
      ]);
      expect(
        result.map((project) => [project.id, project.displayOrder]),
      ).toEqual([
        ['app', 4],
        ['uncertain', 8],
        ['gl-id', 10],
      ]);
      expect(result[1].description).toBe('Saved description');
    });

    it('updates a collaborator project from its URL instead of a namesake in the account listing', async () => {
      const selected = {
        ...saved('collaboration', 'github', 'https://github.com/team-two/app'),
        repoName: 'app',
      };
      repository.findByUserId.mockResolvedValue([selected]);
      socialAccountRepository.findByUserId.mockResolvedValue([
        account('github'),
      ]);
      providerRepositoriesService.fetchGitHubRepositories.mockResolvedValue([
        {
          ...remote(selected),
          repoUrl: 'https://github.com/owner/app',
          starsCount: 10,
        },
      ]);
      providerRepositoriesService.fetchGitHubRepository.mockResolvedValue({
        ...remote(selected),
        starsCount: 99,
      });
      repository.syncMetadataForUser.mockResolvedValue([selected]);
      await service.syncProjects(userId);
      expect(repository.syncMetadataForUser.mock.calls[0][1]).toEqual([
        expect.objectContaining({
          id: selected.id,
          starsCount: 99,
          repoUrl: selected.repoUrl,
        }),
      ]);
      expect(
        providerRepositoriesService.fetchGitHubRepositories,
      ).not.toHaveBeenCalled();
    });

    it('preserves a project when its account is unavailable and reads the latest selection', async () => {
      const first = saved('unconnected');
      repository.findByUserId
        .mockResolvedValueOnce([first])
        .mockResolvedValueOnce([]);
      socialAccountRepository.findByUserId.mockResolvedValue([]);
      await expect(service.syncProjects(userId)).resolves.toEqual([]);
      expect(
        providerRepositoriesService.fetchGitHubRepository,
      ).not.toHaveBeenCalled();
      expect(repository.syncMetadataForUser).not.toHaveBeenCalled();
      expect(repository.replaceForUser).not.toHaveBeenCalled();
    });

    it('preserves the existing records when every remote lookup is inconclusive', async () => {
      const first = saved('unavailable');
      repository.findByUserId.mockResolvedValue([first]);
      socialAccountRepository.findByUserId.mockResolvedValue([
        account('github'),
      ]);
      providerRepositoriesService.fetchGitHubRepository.mockResolvedValue(null);
      await expect(service.syncProjects(userId)).resolves.toMatchObject([
        { id: first.id, description: first.description },
      ]);
      expect(repository.syncMetadataForUser).not.toHaveBeenCalled();
      expect(repository.replaceForUser).not.toHaveBeenCalled();
    });

    it('does not persist partial metadata when another provider fails', async () => {
      const first = saved('first');
      const second = saved(
        'second',
        'gitlab',
        'https://gitlab.com/group/second',
      );
      repository.findByUserId.mockResolvedValue([first, second]);
      socialAccountRepository.findByUserId.mockResolvedValue([
        account('github'),
        account('gitlab'),
      ]);
      providerRepositoriesService.fetchGitHubRepository.mockResolvedValue(
        remote(first),
      );
      providerRepositoriesService.fetchGitLabRepository.mockRejectedValue(
        new ExternalProviderUnavailableException(),
      );
      await expect(service.syncProjects(userId)).rejects.toBeInstanceOf(
        ExternalProviderUnavailableException,
      );
      expect(repository.syncMetadataForUser).not.toHaveBeenCalled();
      expect(repository.replaceForUser).not.toHaveBeenCalled();
    });
  });
});
