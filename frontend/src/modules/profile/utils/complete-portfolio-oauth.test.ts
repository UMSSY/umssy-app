import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  completeGithubOAuth,
  completePortfolioOAuth,
} from './complete-portfolio-oauth';
import { portfolioAccountsService } from '../services/portfolio-accounts.service';

vi.mock('@/shared/services/storage/access-token-storage', () => ({
  initializeAccessTokenStorage: vi.fn().mockResolvedValue(undefined),
  getAccessToken: vi.fn().mockReturnValue('session-token'),
}));
vi.mock('../services/portfolio-accounts.service', () => ({
  portfolioAccountsService: {
    completeOAuthCallback: vi.fn().mockResolvedValue({}),
  },
}));

describe('GitHub OAuth callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
