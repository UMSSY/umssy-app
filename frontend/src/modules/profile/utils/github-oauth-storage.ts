import {
  readSessionStorage,
  removeSessionStorage,
  writeSessionStorage,
} from '@/shared/services/storage/browser-session-storage';

const GITHUB_OAUTH_KEY = 'umssy.github.oauth';

export function saveGithubOAuthAttempt(
  state: string,
  verifier: string,
): boolean {
  return writeSessionStorage(
    GITHUB_OAUTH_KEY,
    JSON.stringify({ state, verifier }),
  );
}

export function takeGithubOAuthAttempt(): {
  state: string;
  verifier: string;
} | null {
  const stored = readSessionStorage(GITHUB_OAUTH_KEY);
  if (!removeSessionStorage(GITHUB_OAUTH_KEY) || !stored) return null;
  try {
    const value: unknown = JSON.parse(stored);
    if (typeof value !== 'object' || value === null) return null;
    const attempt = value as Record<string, unknown>;
    return typeof attempt.state === 'string' &&
      typeof attempt.verifier === 'string'
      ? { state: attempt.state, verifier: attempt.verifier }
      : null;
  } catch {
    return null;
  }
}
