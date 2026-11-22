import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { completeGithubOAuth } from '../utils/complete-github-oauth';
import { GithubOAuthCallback } from './github-oauth-callback';

vi.mock('../utils/complete-github-oauth', () => ({
  completeGithubOAuth: vi.fn(() => new Promise<string>(() => {})),
}));

describe('GitHub OAuth callback page', () => {
  afterEach(cleanup);

  it('reuses the pending exchange if session restoration remounts the page', () => {
    window.history.replaceState({}, '', '/oauth/github/callback?code=code-1&state=state-1');
    const first = render(<GithubOAuthCallback />);
    expect(completeGithubOAuth).toHaveBeenCalledTimes(1);
    expect(vi.mocked(completeGithubOAuth).mock.calls[0][0].get('code')).toBe('code-1');
    expect(window.location.search).toBe('');

    first.unmount();
    render(<GithubOAuthCallback />);

    expect(completeGithubOAuth).toHaveBeenCalledTimes(1);
  });
});
