import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as storage from '@/shared/services/storage/browser-session-storage';
import {
  saveGithubOAuthAttempt,
  takeGithubOAuthAttempt,
} from './github-oauth-storage';

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
});
