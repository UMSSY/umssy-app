import type { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExternalProviderUnavailableException } from '../exceptions/external-provider-unavailable.exception.js';
import { OAuthExchangeFailedException } from '../exceptions/oauth-exchange-failed.exception.js';
import { UnsupportedPortfolioProviderException } from '../exceptions/unsupported-portfolio-provider.exception.js';
import type { SocialAccountRepository } from '../repositories/social-account.repository.js';
import { SocialOAuthService } from '../services/social-oauth.service.js';
import type { PortfolioProvider } from '../types/portfolio-provider.type.js';

const userId = '11111111-1111-4111-8111-111111111111';

describe('SocialOAuthService', () => {
  let service: SocialOAuthService;
  let configMock: {
    get: ReturnType<typeof vi.fn>;
  };
  let socialAccountRepositoryMock: {
    upsertAccount: ReturnType<typeof vi.fn>;
  };

  const originalFetch = global.fetch;

  beforeEach(() => {
    configMock = {
      get: vi.fn((key: string) => {
        switch (key) {
          case 'GITHUB_CLIENT_ID':
            return 'gh-client-id';
          case 'GITHUB_CLIENT_SECRET':
            return 'gh-client-secret';
          case 'GITHUB_CALLBACK_URL':
            return 'https://app.umssy.test/oauth/github/callback';
          case 'GITLAB_CLIENT_ID':
            return 'gl-client-id';
          case 'GITLAB_CLIENT_SECRET':
            return 'gl-client-secret';
          case 'GITLAB_CALLBACK_URL':
            return 'https://app.umssy.test/oauth/gitlab/callback';
          default:
            return undefined;
        }
      }),
    };

    socialAccountRepositoryMock = {
      upsertAccount: vi.fn(),
    };

    service = new SocialOAuthService(
      configMock as unknown as ConfigService,
      socialAccountRepositoryMock as unknown as SocialAccountRepository,
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('getAuthorizationUrl', () => {
    it('returns authorization URL for GitHub with read:user scope', () => {
      const result = service.getAuthorizationUrl('github', 'csrf-token-123');

      expect(result.url).toContain('https://github.com/login/oauth/authorize');
      expect(result.url).toContain('client_id=gh-client-id');
      expect(result.url).toContain('scope=read%3Auser');
      expect(result.url).toContain('state=csrf-token-123');
      expect(result.url).toContain(
        'redirect_uri=https%3A%2F%2Fapp.umssy.test%2Foauth%2Fgithub%2Fcallback',
      );
    });

    it('returns authorization URL for GitHub without optional state or callback', () => {
      configMock.get.mockReturnValue(undefined);

      const result = service.getAuthorizationUrl('github');

      expect(result.url).toContain('https://github.com/login/oauth/authorize');
      expect(result.url).toContain('scope=read%3Auser');
      expect(result.url).not.toContain('state=');
      expect(result.url).not.toContain('redirect_uri=');
    });

    it('returns authorization URL for GitLab with read_user scope and response_type=code', () => {
      const result = service.getAuthorizationUrl('gitlab', 'state-xyz');

      expect(result.url).toContain('https://gitlab.com/oauth/authorize');
      expect(result.url).toContain('client_id=gl-client-id');
      expect(result.url).toContain('response_type=code');
      expect(result.url).toContain('scope=read_user');
      expect(result.url).toContain('state=state-xyz');
      expect(result.url).toContain(
        'redirect_uri=https%3A%2F%2Fapp.umssy.test%2Foauth%2Fgitlab%2Fcallback',
      );
    });

    it('returns authorization URL for GitLab without optional state or callback', () => {
      configMock.get.mockReturnValue(undefined);

      const result = service.getAuthorizationUrl('gitlab');

      expect(result.url).toContain('https://gitlab.com/oauth/authorize');
      expect(result.url).toContain('response_type=code');
      expect(result.url).not.toContain('state=');
      expect(result.url).not.toContain('redirect_uri=');
    });

    it('throws UnsupportedPortfolioProviderException for unknown provider', () => {
      expect(() =>
        service.getAuthorizationUrl('bitbucket' as unknown as PortfolioProvider),
      ).toThrow(UnsupportedPortfolioProviderException);
    });
  });

  describe('connectWithCode - GitHub', () => {
    it('exchanges code for access token in memory, fetches profile, and saves account without exposing token', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            access_token: 'gho_secret_access_token_12345',
            token_type: 'bearer',
            scope: 'read:user',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            id: 1234567,
            login: 'octocat',
            html_url: 'https://github.com/octocat',
          }),
        });
      global.fetch = fetchMock;

      socialAccountRepositoryMock.upsertAccount.mockResolvedValue({
        id: 'acc-uuid',
        userId,
        provider: 'github',
        externalId: '1234567',
        username: 'octocat',
        profileUrl: 'https://github.com/octocat',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.connectWithCode(
        userId,
        'github',
        'auth-code-abc',
      );

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(socialAccountRepositoryMock.upsertAccount).toHaveBeenCalledWith({
        userId,
        provider: 'github',
        externalId: '1234567',
        username: 'octocat',
        profileUrl: 'https://github.com/octocat',
      });

      expect(result).toEqual({
        id: 'acc-uuid',
        provider: 'github',
        username: 'octocat',
        profileUrl: 'https://github.com/octocat',
        connected: true,
      });

      expect(result).not.toHaveProperty('access_token');
      expect(result).not.toHaveProperty('token');
    });

    it('handles profile without html_url by setting profileUrl to null', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            access_token: 'valid_token',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            id: 111,
            login: 'octonull',
            html_url: undefined,
          }),
        });

      socialAccountRepositoryMock.upsertAccount.mockResolvedValue({
        id: 'acc-null',
        userId,
        provider: 'github',
        externalId: '111',
        username: 'octonull',
        profileUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.connectWithCode(userId, 'github', 'code');
      expect(result.profileUrl).toBeNull();
    });

    it('throws OAuthExchangeFailedException if GitHub token exchange returns error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          error: 'bad_verification_code',
          error_description: 'The code passed is incorrect or expired.',
        }),
      });

      await expect(
        service.connectWithCode(userId, 'github', 'invalid-code'),
      ).rejects.toThrow(OAuthExchangeFailedException);
    });

    it('throws OAuthExchangeFailedException if GitHub token response has invalid JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      await expect(
        service.connectWithCode(userId, 'github', 'valid-code'),
      ).rejects.toThrow(OAuthExchangeFailedException);
    });

    it('throws OAuthExchangeFailedException if GitHub token response status is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
      });

      await expect(
        service.connectWithCode(userId, 'github', 'valid-code'),
      ).rejects.toThrow(OAuthExchangeFailedException);
    });

    it('throws ExternalProviderUnavailableException if GitHub token request fails due to network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        service.connectWithCode(userId, 'github', 'valid-code'),
      ).rejects.toThrow(ExternalProviderUnavailableException);
    });

    it('throws ExternalProviderUnavailableException if GitHub user profile request fails due to network error', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            access_token: 'valid_token',
          }),
        })
        .mockRejectedValueOnce(new Error('Network timeout'));

      await expect(
        service.connectWithCode(userId, 'github', 'valid-code'),
      ).rejects.toThrow(ExternalProviderUnavailableException);
    });

    it('throws OAuthExchangeFailedException if GitHub user profile request returns 401', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            access_token: 'valid_token',
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

      await expect(
        service.connectWithCode(userId, 'github', 'valid-code'),
      ).rejects.toThrow(OAuthExchangeFailedException);
    });

    it('throws OAuthExchangeFailedException if GitHub user profile has invalid JSON', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            access_token: 'valid_token',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockRejectedValue(new Error('SyntaxError')),
        });

      await expect(
        service.connectWithCode(userId, 'github', 'valid-code'),
      ).rejects.toThrow(OAuthExchangeFailedException);
    });

    it('throws OAuthExchangeFailedException if GitHub user profile lacks id or login', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            access_token: 'valid_token',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            id: undefined,
            login: '',
          }),
        });

      await expect(
        service.connectWithCode(userId, 'github', 'valid-code'),
      ).rejects.toThrow(OAuthExchangeFailedException);
    });
  });

  describe('connectWithCode - GitLab', () => {
    it('exchanges code for access token in memory, fetches profile, and saves account without exposing token', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            access_token: 'glpat_secret_access_token_67890',
            token_type: 'bearer',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            id: 7654321,
            username: 'gitlabuser',
            web_url: 'https://gitlab.com/gitlabuser',
          }),
        });
      global.fetch = fetchMock;

      socialAccountRepositoryMock.upsertAccount.mockResolvedValue({
        id: 'acc-gl-uuid',
        userId,
        provider: 'gitlab',
        externalId: '7654321',
        username: 'gitlabuser',
        profileUrl: 'https://gitlab.com/gitlabuser',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.connectWithCode(
        userId,
        'gitlab',
        'auth-code-gl',
      );

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(socialAccountRepositoryMock.upsertAccount).toHaveBeenCalledWith({
        userId,
        provider: 'gitlab',
        externalId: '7654321',
        username: 'gitlabuser',
        profileUrl: 'https://gitlab.com/gitlabuser',
      });

      expect(result).toEqual({
        id: 'acc-gl-uuid',
        provider: 'gitlab',
        username: 'gitlabuser',
        profileUrl: 'https://gitlab.com/gitlabuser',
        connected: true,
      });

      expect(result).not.toHaveProperty('access_token');
    });

    it('handles GitLab profile without web_url by setting profileUrl to null', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            access_token: 'valid_token',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            id: 777,
            username: 'noweburl',
            web_url: undefined,
          }),
        });

      socialAccountRepositoryMock.upsertAccount.mockResolvedValue({
        id: 'acc-noweb',
        userId,
        provider: 'gitlab',
        externalId: '777',
        username: 'noweburl',
        profileUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.connectWithCode(userId, 'gitlab', 'code');
      expect(result.profileUrl).toBeNull();
    });

    it('throws OAuthExchangeFailedException if GitLab token exchange fails with status >= 400', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
      });

      await expect(
        service.connectWithCode(userId, 'gitlab', 'invalid-code'),
      ).rejects.toThrow(OAuthExchangeFailedException);
    });

    it('throws OAuthExchangeFailedException if GitLab token response has invalid JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Invalid json')),
      });

      await expect(
        service.connectWithCode(userId, 'gitlab', 'code'),
      ).rejects.toThrow(OAuthExchangeFailedException);
    });

    it('throws OAuthExchangeFailedException if GitLab token response contains error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          error: 'invalid_grant',
          error_description: 'Code invalid',
        }),
      });

      await expect(
        service.connectWithCode(userId, 'gitlab', 'code'),
      ).rejects.toThrow(OAuthExchangeFailedException);
    });

    it('throws ExternalProviderUnavailableException if GitLab token request fails due to network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        service.connectWithCode(userId, 'gitlab', 'code'),
      ).rejects.toThrow(ExternalProviderUnavailableException);
    });

    it('throws ExternalProviderUnavailableException if GitLab user profile request fails due to network error', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            access_token: 'valid_token',
          }),
        })
        .mockRejectedValueOnce(new Error('Timeout'));

      await expect(
        service.connectWithCode(userId, 'gitlab', 'code'),
      ).rejects.toThrow(ExternalProviderUnavailableException);
    });

    it('throws OAuthExchangeFailedException if GitLab user profile response is not ok', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            access_token: 'valid_token',
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
        });

      await expect(
        service.connectWithCode(userId, 'gitlab', 'code'),
      ).rejects.toThrow(OAuthExchangeFailedException);
    });

    it('throws OAuthExchangeFailedException if GitLab user profile has invalid JSON', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            access_token: 'valid_token',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockRejectedValue(new Error('JSON Parse')),
        });

      await expect(
        service.connectWithCode(userId, 'gitlab', 'code'),
      ).rejects.toThrow(OAuthExchangeFailedException);
    });

    it('throws OAuthExchangeFailedException if GitLab user profile is incomplete', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            access_token: 'valid_token',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            id: undefined,
            username: '',
          }),
        });

      await expect(
        service.connectWithCode(userId, 'gitlab', 'code'),
      ).rejects.toThrow(OAuthExchangeFailedException);
    });

    it('throws UnsupportedPortfolioProviderException for unsupported provider in connectWithCode', async () => {
      await expect(
        service.connectWithCode(
          userId,
          'bitbucket' as unknown as PortfolioProvider,
          'code',
        ),
      ).rejects.toThrow(UnsupportedPortfolioProviderException);
    });
  });
});
