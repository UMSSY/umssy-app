import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { completePortfolioOAuth } from '../utils/complete-portfolio-oauth';
import { GithubOAuthCallback } from './github-oauth-callback';
import { resetPendingOAuthExchanges } from './portfolio-oauth-callback';

vi.mock('../utils/complete-portfolio-oauth', () => ({
  completePortfolioOAuth: vi.fn(() => new Promise<string>(() => {})),
}));

afterEach(() => {
  cleanup();
  resetPendingOAuthExchanges();
});

describe('GitHub OAuth callback page', () => {
  it('reuses the pending exchange if session restoration remounts the page', () => {
    window.history.replaceState(
      {},
      '',
      '/oauth/github/callback?code=code-1&state=state-1',
    );
    const first = render(<GithubOAuthCallback />);
    expect(completePortfolioOAuth).toHaveBeenCalledTimes(1);
    expect(vi.mocked(completePortfolioOAuth).mock.calls[0][0]).toBe('github');
    expect(vi.mocked(completePortfolioOAuth).mock.calls[0][1].get('code')).toBe(
      'code-1',
    );
    expect(window.location.search).toBe('');

    first.unmount();
    render(<GithubOAuthCallback />);

    expect(completePortfolioOAuth).toHaveBeenCalledTimes(1);
  });
});
