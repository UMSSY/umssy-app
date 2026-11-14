import type { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExternalProviderUnavailableException } from '../exceptions/external-provider-unavailable.exception.js';
import { ProviderRepositoriesService } from '../services/provider-repositories.service.js';

describe('ProviderRepositoriesService', () => {
  let service: ProviderRepositoriesService;
  let configMock: {
    get: ReturnType<typeof vi.fn>;
  };

  const originalFetch = global.fetch;

  beforeEach(() => {
    configMock = {
      get: vi.fn(),
    };
    service = new ProviderRepositoriesService(
      configMock as unknown as ConfigService,
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('fetchGitHubRepositories', () => {
    it('returns empty array when username is empty', async () => {
      const result = await service.fetchGitHubRepositories('   ');
      expect(result).toEqual([]);
    });

    it('fetches, filters private repos, determines owner, and returns normalized repositories', async () => {
      configMock.get.mockImplementation((key: string) => {
        if (key === 'GITHUB_API_TOKEN') return 'ghp_secret_token';
        return undefined;
      });

      const mockRepos = [
        {
          name: 'project-one',
          html_url: 'https://github.com/octocat/project-one',
          description: 'A test project',
          language: 'TypeScript',
          stargazers_count: 42,
          private: false,
          owner: { login: 'octocat' },
          updated_at: '2026-11-10T15:30:00.000Z',
        },
        {
          name: 'project-private',
          html_url: 'https://github.com/octocat/project-private',
          description: 'Secret project',
          language: 'JavaScript',
          stargazers_count: 0,
          private: true,
          owner: { login: 'octocat' },
          updated_at: '2026-11-10T16:00:00.000Z',
        },
        {
          name: 'contrib-repo',
          html_url: 'https://github.com/other-org/contrib-repo',
          description: null,
          language: null,
          stargazers_count: undefined,
          private: false,
          owner: { login: 'other-org' },
          updated_at: 'invalid-date',
        },
      ];

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockRepos),
      });
      global.fetch = fetchMock;

      const result = await service.fetchGitHubRepositories('octocat');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.github.com/users/octocat/repos?type=all&sort=updated&per_page=100',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer ghp_secret_token',
            'User-Agent': 'UMSSY-App',
          }),
        }),
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        provider: 'github',
        repoName: 'project-one',
        repoUrl: 'https://github.com/octocat/project-one',
        description: 'A test project',
        language: 'TypeScript',
        starsCount: 42,
        isOwner: true,
        updatedAt: '2026-11-10T15:30:00.000Z',
      });
      expect(result[1]).toEqual({
        provider: 'github',
        repoName: 'contrib-repo',
        repoUrl: 'https://github.com/other-org/contrib-repo',
        description: null,
        language: null,
        starsCount: 0,
        isOwner: false,
        updatedAt: expect.any(String),
      });
    });

    it('throws ExternalProviderUnavailableException when response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });

      await expect(service.fetchGitHubRepositories('octocat')).rejects.toThrow(
        ExternalProviderUnavailableException,
      );
    });

    it('throws ExternalProviderUnavailableException when fetch throws a network or timeout error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(service.fetchGitHubRepositories('octocat')).rejects.toThrow(
        ExternalProviderUnavailableException,
      );
    });

    it('throws ExternalProviderUnavailableException when response json fails parsing', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('SyntaxError')),
      });

      await expect(service.fetchGitHubRepositories('octocat')).rejects.toThrow(
        ExternalProviderUnavailableException,
      );
    });

    it('throws ExternalProviderUnavailableException when response json is not an array', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ message: 'Not Found' }),
      });

      await expect(service.fetchGitHubRepositories('octocat')).rejects.toThrow(
        ExternalProviderUnavailableException,
      );
    });
  });

  describe('fetchGitLabRepositories', () => {
    it('returns empty array when both externalId and username are empty', async () => {
      const result = await service.fetchGitLabRepositories('', '');
      expect(result).toEqual([]);
    });

    it('fetches projects by externalId, filters visibility, and normalizes them', async () => {
      configMock.get.mockImplementation((key: string) => {
        if (key === 'GITLAB_API_TOKEN') return 'glpat-token';
        return undefined;
      });

      const mockProjects = [
        {
          name: 'gitlab-project',
          web_url: 'https://gitlab.com/gluser/gitlab-project',
          description: 'GitLab public project',
          star_count: 10,
          visibility: 'public',
          namespace: { kind: 'user', path: 'gluser' },
          last_activity_at: '2026-11-12T10:00:00.000Z',
        },
        {
          name: 'gitlab-default-visibility',
          web_url: 'https://gitlab.com/other-ns/repo',
          description: null,
          star_count: undefined,
          visibility: undefined,
          namespace: { kind: 'group', path: 'other-ns' },
          updated_at: undefined,
        },
        {
          name: 'gitlab-internal',
          web_url: 'https://gitlab.com/gluser/gitlab-internal',
          visibility: 'internal',
          namespace: { kind: 'user', path: 'gluser' },
        },
      ];

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockProjects),
      });
      global.fetch = fetchMock;

      const result = await service.fetchGitLabRepositories('987654', 'gluser');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://gitlab.com/api/v4/users/987654/projects?visibility=public&per_page=100',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer glpat-token',
            'User-Agent': 'UMSSY-App',
          }),
        }),
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        provider: 'gitlab',
        repoName: 'gitlab-project',
        repoUrl: 'https://gitlab.com/gluser/gitlab-project',
        description: 'GitLab public project',
        language: null,
        starsCount: 10,
        isOwner: true,
        updatedAt: '2026-11-12T10:00:00.000Z',
      });
      expect(result[1]).toEqual({
        provider: 'gitlab',
        repoName: 'gitlab-default-visibility',
        repoUrl: 'https://gitlab.com/other-ns/repo',
        description: null,
        language: null,
        starsCount: 0,
        isOwner: false,
        updatedAt: expect.any(String),
      });
    });

    it('falls back to username query when externalId endpoint returns 404', async () => {
      const mockProjects = [
        {
          name: 'fallback-project',
          web_url: 'https://gitlab.com/fallback-user/fallback-project',
          visibility: 'public',
          namespace: { kind: 'group', path: 'org-group' },
          updated_at: '2026-11-11T12:00:00.000Z',
        },
      ];

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue(mockProjects),
        });
      global.fetch = fetchMock;

      const result = await service.fetchGitLabRepositories(
        'unknown-id',
        'fallback-user',
      );

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(1);
      expect(result[0]?.repoName).toBe('fallback-project');
      expect(result[0]?.isOwner).toBe(false);
    });

    it('throws ExternalProviderUnavailableException when 404 and username is not provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(service.fetchGitLabRepositories('ext-id-only')).rejects.toThrow(
        ExternalProviderUnavailableException,
      );
    });

    it('throws ExternalProviderUnavailableException when response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(
        service.fetchGitLabRepositories('987654', 'gluser'),
      ).rejects.toThrow(ExternalProviderUnavailableException);
    });

    it('throws ExternalProviderUnavailableException when json parsing fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('SyntaxError')),
      });

      await expect(
        service.fetchGitLabRepositories('987654', 'gluser'),
      ).rejects.toThrow(ExternalProviderUnavailableException);
    });

    it('throws ExternalProviderUnavailableException when payload is not array', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ error: 'invalid' }),
      });

      await expect(
        service.fetchGitLabRepositories('987654', 'gluser'),
      ).rejects.toThrow(ExternalProviderUnavailableException);
    });
  });
});
