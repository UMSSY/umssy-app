import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { completePortfolioOAuth } from '../utils/complete-portfolio-oauth';
import { GitlabOAuthCallback } from './gitlab-oauth-callback';
import { resetPendingOAuthExchanges } from './portfolio-oauth-callback';

vi.mock('../utils/complete-portfolio-oauth', () => ({
  completePortfolioOAuth: vi.fn(() => new Promise<string>(() => {})),
}));

afterEach(() => {
  cleanup();
  resetPendingOAuthExchanges();
});

describe('GitLab OAuth callback', () => {
  it('handles a pending exchange once even if the session remounts the page', () => {
    window.history.replaceState(
      {},
      '',
      '/oauth/gitlab/callback?code=code-1&state=state-1',
    );
    const first = render(<GitlabOAuthCallback />);
    expect(completePortfolioOAuth).toHaveBeenCalledTimes(1);
    expect(vi.mocked(completePortfolioOAuth).mock.calls[0][0]).toBe('gitlab');
    expect(vi.mocked(completePortfolioOAuth).mock.calls[0][1].get('code')).toBe(
      'code-1',
    );
    expect(window.location.search).toBe('');
    first.unmount();
    render(<GitlabOAuthCallback />);
    expect(completePortfolioOAuth).toHaveBeenCalledTimes(1);
  });
});
