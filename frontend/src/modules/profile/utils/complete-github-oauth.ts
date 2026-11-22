import { isApiError } from '@/shared/services/api-client';
import {
  initializeAccessTokenStorage,
  getAccessToken,
} from '@/shared/services/storage/access-token-storage';
import { portfolioAccountsService } from '../services/portfolio-accounts.service';
import { takeGithubOAuthAttempt } from './github-oauth-storage';

export async function completeGithubOAuth(
  params: URLSearchParams,
): Promise<string> {
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');
  try {
    const pending = takeGithubOAuthAttempt();
    if (
      !state ||
      pending?.state !== state ||
      typeof pending.verifier !== 'string'
    )
      return 'error';
    if (error === 'access_denied') return 'cancelled';
    if (error || !code) return 'error';
    await initializeAccessTokenStorage();
    if (!getAccessToken()) return 'error';
    await portfolioAccountsService.completeOAuthCallback('github', {
      code,
      state,
      verifier: pending.verifier,
    });
    return 'success';
  } catch (cause) {
    return isApiError(cause) && cause.response?.status === 409
      ? 'conflict'
      : 'error';
  }
}
