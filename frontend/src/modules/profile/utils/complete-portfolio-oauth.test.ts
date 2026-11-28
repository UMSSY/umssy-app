import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  completeGithubOAuth,
  completePortfolioOAuth,
} from './complete-portfolio-oauth';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { hasCookieSession } from '@/shared/services/storage/cookie-session-state';
import { hasSessionMarker } from '@/shared/utils/session-marker';
import { executeSharedRefresh } from '@/shared/utils/session-refresh-lock';
import { portfolioAccountsService } from '../services/portfolio-accounts.service';

vi.mock('@/shared/services/storage/access-token-storage', () => ({
  initializeAccessTokenStorage: vi.fn().mockResolvedValue(undefined),
  getAccessToken: vi.fn().mockReturnValue('session-token'),
}));
vi.mock('@/shared/utils/session-refresh-lock', () => ({
  executeSharedRefresh: vi.fn().mockResolvedValue(true),
}));
vi.mock('@/shared/services/storage/cookie-session-state', () => ({
  hasCookieSession: vi.fn().mockReturnValue(false),
}));
vi.mock('@/shared/utils/session-marker', () => ({
  hasSessionMarker: vi.fn().mockReturnValue(false),
}));
vi.mock('../services/portfolio-accounts.service', () => ({
  portfolioAccountsService: {
    completeOAuthCallback: vi.fn().mockResolvedValue({}),
  },
}));

describe('GitHub OAuth callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAccessToken).mockReturnValue('session-token');
    vi.mocked(executeSharedRefresh).mockResolvedValue(true);
    vi.mocked(hasCookieSession).mockReturnValue(false);
    vi.mocked(hasSessionMarker).mockReturnValue(false);
    sessionStorage.clear();
    sessionStorage.setItem(
      'umssy.github.oauth',
      JSON.stringify({ state: 'state-1', verifier: 'verifier-1' }),
    );
  });

  it('uses the original state and verifier to finish the connection', async () => {
    expect(
      await completeGithubOAuth(
        new URLSearchParams('code=code-1&state=state-1'),
      ),
    ).toBe('success');
    expect(portfolioAccountsService.completeOAuthCallback).toHaveBeenCalledWith(
      'github',
      { code: 'code-1', state: 'state-1', verifier: 'verifier-1' },
    );
    expect(sessionStorage.getItem('umssy.github.oauth')).toBeNull();
  });

  it('rejects an unexpected state without contacting the backend', async () => {
    expect(
      await completeGithubOAuth(new URLSearchParams('code=code-1&state=other')),
    ).toBe('error');
    expect(
      portfolioAccountsService.completeOAuthCallback,
    ).not.toHaveBeenCalled();
  });

  it('handles cancellation without connecting', async () => {
    expect(
      await completeGithubOAuth(
        new URLSearchParams('error=access_denied&state=state-1'),
      ),
    ).toBe('cancelled');
    expect(
      portfolioAccountsService.completeOAuthCallback,
    ).not.toHaveBeenCalled();
  });

  it('completes GitLab using only the GitLab pending attempt', async () => {
    sessionStorage.setItem(
      'umssy.gitlab.oauth',
      JSON.stringify({ state: 'gitlab-state', verifier: 'gitlab-verifier' }),
    );
    expect(
      await completePortfolioOAuth(
        'gitlab',
        new URLSearchParams('code=code-1&state=gitlab-state'),
      ),
    ).toBe('success');
    expect(portfolioAccountsService.completeOAuthCallback).toHaveBeenCalledWith(
      'gitlab',
      { code: 'code-1', state: 'gitlab-state', verifier: 'gitlab-verifier' },
    );
    expect(sessionStorage.getItem('umssy.github.oauth')).not.toBeNull();
  });

  it('does not connect GitLab when the state does not match', async () => {
    sessionStorage.setItem(
      'umssy.gitlab.oauth',
      JSON.stringify({ state: 'gitlab-state', verifier: 'gitlab-verifier' }),
    );
    expect(
      await completePortfolioOAuth(
        'gitlab',
        new URLSearchParams('code=code-1&state=wrong'),
      ),
    ).toBe('error');
    expect(
      portfolioAccountsService.completeOAuthCallback,
    ).not.toHaveBeenCalled();
  });

  it('handles GitLab cancellation without connecting', async () => {
    sessionStorage.setItem(
      'umssy.gitlab.oauth',
      JSON.stringify({ state: 'gitlab-state', verifier: 'gitlab-verifier' }),
    );
    expect(
      await completePortfolioOAuth(
        'gitlab',
        new URLSearchParams('error=access_denied&state=gitlab-state'),
      ),
    ).toBe('cancelled');
    expect(
      portfolioAccountsService.completeOAuthCallback,
    ).not.toHaveBeenCalled();
  });

  it('rehydrates the session when token is not in memory after external redirect', async () => {
    vi.mocked(getAccessToken).mockReturnValueOnce(null).mockReturnValue('restored-token');
    expect(
      await completeGithubOAuth(
        new URLSearchParams('code=code-1&state=state-1'),
      ),
    ).toBe('success');
    expect(executeSharedRefresh).toHaveBeenCalledWith(undefined, { wait: true });
    expect(portfolioAccountsService.completeOAuthCallback).toHaveBeenCalledWith(
      'github',
      { code: 'code-1', state: 'state-1', verifier: 'verifier-1' },
    );
  });

  it('aborts with error when user has no active session and refresh fails', async () => {
    vi.mocked(getAccessToken).mockReturnValue(null);
    vi.mocked(executeSharedRefresh).mockResolvedValue(false);
    vi.mocked(hasCookieSession).mockReturnValue(false);
    vi.mocked(hasSessionMarker).mockReturnValue(false);

    expect(
      await completeGithubOAuth(
        new URLSearchParams('code=code-1&state=state-1'),
      ),
    ).toBe('error');
    expect(
      portfolioAccountsService.completeOAuthCallback,
    ).not.toHaveBeenCalled();
  });

  it('allows connection when session marker is active even without in-memory token', async () => {
    vi.mocked(getAccessToken).mockReturnValue(null);
    vi.mocked(hasSessionMarker).mockReturnValue(true);

    expect(
      await completeGithubOAuth(
        new URLSearchParams('code=code-1&state=state-1'),
      ),
    ).toBe('success');
    expect(portfolioAccountsService.completeOAuthCallback).toHaveBeenCalledWith(
      'github',
      { code: 'code-1', state: 'state-1', verifier: 'verifier-1' },
    );
  });

  it('returns conflict when the social account is already linked to another user (HTTP 409)', async () => {
    const conflictError = Object.assign(new Error('Conflict'), {
      isAxiosError: true,
      response: { status: 409 },
    });
    vi.mocked(portfolioAccountsService.completeOAuthCallback).mockRejectedValueOnce(conflictError);

    expect(
      await completeGithubOAuth(
        new URLSearchParams('code=code-1&state=state-1'),
      ),
    ).toBe('conflict');
  });
});
