import type { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExternalProviderUnavailableException } from '../exceptions/external-provider-unavailable.exception.js';
import { ExternalRepositoryMapper } from '../mappers/external-repository.mapper.js';
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
      new ExternalRepositoryMapper(),
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

      await expect(
        service.fetchGitLabRepositories('ext-id-only'),
      ).rejects.toThrow(ExternalProviderUnavailableException);
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

  function githubRepo(name = 'selected', owner = 'octocat') {
    return {
      name,
      html_url: `https://github.com/${owner}/${name}`,
      private: false,
      owner: { login: owner },
    };
  }

  function gitlabRepo(name = 'selected', namespace = 'group/subgroup') {
    return {
      name,
      web_url: `https://gitlab.com/${namespace}/${name}`,
      visibility: 'public',
      namespace: { kind: 'group', path: namespace },
    };
  }

  function response(
    payload: unknown,
    headers: Record<string, string> = {},
    status = 200,
  ) {
    return new Response(JSON.stringify(payload), { status, headers });
  }

  describe('complete pagination', () => {
    it('returns GitHub projects beyond the first 100 and follows only the page number from Link', async () => {
      const first = Array.from({ length: 100 }, (_, index) =>
        githubRepo(`repo-${index}`),
      );
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          response(first, {
            link: '<https://api.github.com/users/octocat/repos?type=all&sort=updated&per_page=100&page=2>; rel="next"',
          }),
        )
        .mockResolvedValueOnce(response([githubRepo('selected-beyond-100')]));
      global.fetch = fetchMock;

      const result = await service.fetchGitHubRepositories('octocat');

      expect(result).toHaveLength(101);
      expect(result[100].repoName).toBe('selected-beyond-100');
      expect(fetchMock.mock.calls[1][0]).toBe(
        'https://api.github.com/users/octocat/repos?type=all&sort=updated&per_page=100&page=2',
      );
    });

    it('requests a final empty GitHub page when exactly 100 entries arrive without pagination headers', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          response(
            Array.from({ length: 100 }, (_, index) =>
              githubRepo(`repo-${index}`),
            ),
          ),
        )
        .mockResolvedValueOnce(response([]));
      global.fetch = fetchMock;
      await expect(
        service.fetchGitHubRepositories('octocat'),
      ).resolves.toHaveLength(100);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not return a partial GitHub list if page two fails', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          response(
            Array.from({ length: 100 }, (_, index) =>
              githubRepo(`repo-${index}`),
            ),
          ),
        )
        .mockResolvedValueOnce(
          response({ message: 'Rate limit exceeded' }, {}, 429),
        );
      await expect(
        service.fetchGitHubRepositories('octocat'),
      ).rejects.toBeInstanceOf(ExternalProviderUnavailableException);
    });

    it('follows GitLab x-next-page even when the current page is short', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          response([gitlabRepo('first')], { 'x-next-page': '2' }),
        )
        .mockResolvedValueOnce(
          response([gitlabRepo('second')], { 'x-next-page': '' }),
        );
      global.fetch = fetchMock;
      await expect(
        service.fetchGitLabRepositories('123', 'user'),
      ).resolves.toHaveLength(2);
      expect(fetchMock.mock.calls[1][0]).toBe(
        'https://gitlab.com/api/v4/users/123/projects?visibility=public&per_page=100&page=2',
      );
    });

    it('paginates GitLab beyond 100 when headers are absent', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          response(
            Array.from({ length: 100 }, (_, index) =>
              gitlabRepo(`repo-${index}`),
            ),
          ),
        )
        .mockResolvedValueOnce(response([gitlabRepo('last')]));
      await expect(
        service.fetchGitLabRepositories('123', 'user'),
      ).resolves.toHaveLength(101);
    });

    it('retains GitLab username fallback while following later pages', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(response({}, {}, 404))
        .mockResolvedValueOnce(
          response([gitlabRepo('first')], { 'x-next-page': '2' }),
        )
        .mockResolvedValueOnce(
          response([gitlabRepo('second')], { 'x-next-page': '' }),
        );
      global.fetch = fetchMock;
      await expect(
        service.fetchGitLabRepositories('old-id', 'current-user'),
      ).resolves.toHaveLength(2);
      expect(fetchMock.mock.calls[2][0]).toBe(
        'https://gitlab.com/api/v4/users/current-user/projects?visibility=public&per_page=100&page=2',
      );
    });

    it('does not return a partial GitLab list after a later-page failure', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          response([gitlabRepo('first')], { 'x-next-page': '2' }),
        )
        .mockRejectedValueOnce(new Error('timeout'));
      await expect(
        service.fetchGitLabRepositories('123'),
      ).rejects.toBeInstanceOf(ExternalProviderUnavailableException);
    });

    it.each([
      '<https://untrusted.example/repos?page=2>; rel="next"',
      '<https://api.github.com/users/octocat/repos?page=1>; rel="next"',
      '<https://api.github.com/other-path?page=2>; rel="next"',
      '<https://api.github.com/users/octocat/repos?page=abc>; rel="next"',
    ])('rejects unsafe or looping pagination: %s', async (link) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(response([githubRepo()], { link }));
      global.fetch = fetchMock;
      await expect(
        service.fetchGitHubRepositories('octocat'),
      ).rejects.toBeInstanceOf(ExternalProviderUnavailableException);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('rejects a malformed later page rather than returning partial results', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          response([githubRepo()], {
            link: '<https://api.github.com/users/octocat/repos?page=2>; rel="next"',
          }),
        )
        .mockResolvedValueOnce(response({ repositories: [] }));
      await expect(
        service.fetchGitHubRepositories('octocat'),
      ).rejects.toBeInstanceOf(ExternalProviderUnavailableException);
    });
  });

  describe('selected repository lookup', () => {
    it('fetches a selected GitHub repository directly instead of relying on the account first page', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          response(githubRepo('older-selected', 'other-owner')),
        );
      global.fetch = fetchMock;
      const result = await service.fetchGitHubRepository(
        'https://github.com/other-owner/older-selected',
        'octocat',
      );
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://api.github.com/repos/other-owner/older-selected',
      );
      expect(result).toMatchObject({
        repoUrl: 'https://github.com/other-owner/older-selected',
        isOwner: false,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('distinguishes repositories with the same name but different owners', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(response(githubRepo('same', 'owner-one')))
        .mockResolvedValueOnce(response(githubRepo('same', 'owner-two')));
      global.fetch = fetchMock;
      const first = await service.fetchGitHubRepository(
        'https://github.com/owner-one/same',
        'owner-one',
      );
      const second = await service.fetchGitHubRepository(
        'https://github.com/owner-two/same',
        'owner-one',
      );
      expect(first?.repoUrl).not.toBe(second?.repoUrl);
      expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
        'https://api.github.com/repos/owner-one/same',
        'https://api.github.com/repos/owner-two/same',
      ]);
    });

    it('looks up a GitLab collaborator project by the complete encoded namespace path', async () => {
      const fetchMock = vi.fn().mockResolvedValueOnce(response(gitlabRepo()));
      global.fetch = fetchMock;
      const result = await service.fetchGitLabRepository(
        'https://gitlab.com/group/subgroup/selected',
        'collaborator',
      );
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://gitlab.com/api/v4/projects/group%2Fsubgroup%2Fselected',
      );
      expect(result?.repoUrl).toBe(
        'https://gitlab.com/group/subgroup/selected',
      );
    });

    it.each([403, 404])(
      'returns unknown availability for GitHub HTTP %s instead of confirming deletion',
      async (status) => {
        global.fetch = vi.fn().mockResolvedValueOnce(response({}, {}, status));
        await expect(
          service.fetchGitHubRepository(
            'https://github.com/owner/selected',
            'owner',
          ),
        ).resolves.toBeNull();
      },
    );

    it.each([403, 404])(
      'returns unknown availability for GitLab HTTP %s instead of confirming deletion',
      async (status) => {
        global.fetch = vi.fn().mockResolvedValueOnce(response({}, {}, status));
        await expect(
          service.fetchGitLabRepository(
            'https://gitlab.com/owner/selected',
            'owner',
          ),
        ).resolves.toBeNull();
      },
    );

    it('does not publish metadata from a repository confirmed as private', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(response({ ...githubRepo(), private: true }));
      await expect(
        service.fetchGitHubRepository(
          'https://github.com/octocat/selected',
          'octocat',
        ),
      ).resolves.toBeNull();
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          response({ ...gitlabRepo(), visibility: 'private' }),
        );
      await expect(
        service.fetchGitLabRepository(
          'https://gitlab.com/group/subgroup/selected',
          'user',
        ),
      ).resolves.toBeNull();
    });

    it.each([429, 500, 503])(
      'propagates GitHub HTTP %s so callers can avoid persisting a partial sync',
      async (status) => {
        global.fetch = vi.fn().mockResolvedValueOnce(response({}, {}, status));
        await expect(
          service.fetchGitHubRepository(
            'https://github.com/owner/selected',
            'owner',
          ),
        ).rejects.toBeInstanceOf(ExternalProviderUnavailableException);
      },
    );

    it('propagates timeouts and malformed payloads', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('timeout'));
      await expect(
        service.fetchGitLabRepository(
          'https://gitlab.com/group/project',
          'user',
        ),
      ).rejects.toBeInstanceOf(ExternalProviderUnavailableException);
      for (const payload of [
        [],
        {},
        { name: 'selected', html_url: 'invalid' },
        { ...githubRepo(), description: {} },
      ]) {
        global.fetch = vi.fn().mockResolvedValueOnce(response(payload));
        await expect(
          service.fetchGitHubRepository(
            'https://github.com/octocat/selected',
            'octocat',
          ),
        ).rejects.toBeInstanceOf(ExternalProviderUnavailableException);
      }
    });

    it.each([
      'https://evil.example/owner/repo',
      'http://github.com/owner/repo',
      'https://github.com@evil.example/owner/repo',
      'https://user:pass@github.com/owner/repo',
      'https://github.com/owner/repo/tree/main',
      'https://github.com/owner%2Fother/repo',
    ])(
      'does not request a noncanonical or unsafe repository URL: %s',
      async (url) => {
        const fetchMock = vi.fn();
        global.fetch = fetchMock;
        await expect(
          service.fetchGitHubRepository(url, 'owner'),
        ).resolves.toBeNull();
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );

    it('follows a safe GitHub repository transfer redirect', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          response(
            {},
            { location: 'https://api.github.com/repositories/1234' },
            301,
          ),
        )
        .mockResolvedValueOnce(response(githubRepo('renamed', 'new-owner')));
      global.fetch = fetchMock;
      const result = await service.fetchGitHubRepository(
        'https://github.com/old-owner/old-name',
        'user',
      );
      expect(result?.repoUrl).toBe('https://github.com/new-owner/renamed');
      expect(fetchMock.mock.calls[1][0]).toBe(
        'https://api.github.com/repositories/1234',
      );
    });

    it('does not forward configured credentials to a redirect outside the provider API', async () => {
      configMock.get.mockReturnValue('private-token');
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          response({}, { location: 'https://evil.example/collect' }, 302),
        );
      global.fetch = fetchMock;
      await expect(
        service.fetchGitHubRepository(
          'https://github.com/owner/project',
          'owner',
        ),
      ).rejects.toBeInstanceOf(ExternalProviderUnavailableException);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: 'manual' });
    });
  });
});
