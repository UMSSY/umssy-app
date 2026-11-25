import {
  readSessionStorage,
  removeSessionStorage,
  writeSessionStorage,
} from '@/shared/services/storage/browser-session-storage';

import type { PortfolioProviderName } from '../types/portfolio-provider-name.types';

export function savePortfolioOAuthAttempt(
  provider: PortfolioProviderName,
  state: string,
  verifier: string,
): boolean {
  return writeSessionStorage(
    `umssy.${provider}.oauth`,
    JSON.stringify({ state, verifier }),
  );
}

export function takePortfolioOAuthAttempt(
  provider: PortfolioProviderName,
): { state: string; verifier: string } | null {
  const key = `umssy.${provider}.oauth`;
  const stored = readSessionStorage(key);
  if (!removeSessionStorage(key) || !stored) return null;
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

export function saveGithubOAuthAttempt(
  state: string,
  verifier: string,
): boolean {
  return savePortfolioOAuthAttempt('github', state, verifier);
}

export function takeGithubOAuthAttempt(): {
  state: string;
  verifier: string;
} | null {
  return takePortfolioOAuthAttempt('github');
}
