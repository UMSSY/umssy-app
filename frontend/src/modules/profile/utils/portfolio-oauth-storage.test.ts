import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as storage from '@/shared/services/storage/browser-session-storage';
import {
  saveGithubOAuthAttempt,
  takeGithubOAuthAttempt,
  savePortfolioOAuthAttempt,
  takePortfolioOAuthAttempt,
} from './portfolio-oauth-storage';

describe('GitHub OAuth pending attempt storage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores and consumes the pending attempt once', () => {
    expect(saveGithubOAuthAttempt('state', 'verifier')).toBe(true);
    expect(takeGithubOAuthAttempt()).toEqual({
      state: 'state',
      verifier: 'verifier',
    });
    expect(takeGithubOAuthAttempt()).toBeNull();
  });

  it('returns failure if storage is unavailable', () => {
    vi.spyOn(storage, 'writeSessionStorage').mockReturnValue(false);
    expect(saveGithubOAuthAttempt('state', 'verifier')).toBe(false);
  });

  it('rejects malformed stored attempts', () => {
    storage.writeSessionStorage('umssy.github.oauth', '{');
    expect(takeGithubOAuthAttempt()).toBeNull();
  });

  it('keeps GitHub and GitLab authorization attempts separate', () => {
    savePortfolioOAuthAttempt('github', 'github-state', 'github-verifier');
    savePortfolioOAuthAttempt('gitlab', 'gitlab-state', 'gitlab-verifier');
    expect(takePortfolioOAuthAttempt('gitlab')).toEqual({
      state: 'gitlab-state',
      verifier: 'gitlab-verifier',
    });
    expect(takePortfolioOAuthAttempt('github')).toEqual({
      state: 'github-state',
      verifier: 'github-verifier',
    });
  });
});
