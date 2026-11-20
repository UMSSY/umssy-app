import { decodeGoogleIdToken } from './decode-google-id-token';
import { getSafeNextPath } from './safe-next-path';
import type {
  GoogleOAuthCallbackResult,
  GoogleOAuthProfile,
  GoogleOAuthRequestOptions,
  PendingGoogleOAuthRequest,
} from '../types/google-oauth-flow.types';

export const GOOGLE_OAUTH_CALLBACK_PATH = '/oauth/google/callback';
export const GOOGLE_OAUTH_REQUEST_PREFIX = 'umssy_google_oauth_request:';
export const GOOGLE_OAUTH_MESSAGE_TYPE = 'UMSSY_GOOGLE_OAUTH_RESPONSE';
export const GOOGLE_OAUTH_REQUEST_TTL_MS = 5 * 60 * 1000;

const invalidRequest = () =>
  new Error('El acceso con Google venció o no es válido. Inicia el proceso de nuevo.');

function randomValue(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

function consumeRequest(state: string): PendingGoogleOAuthRequest {
  if (!/^[a-f0-9]{64}$/.test(state)) throw invalidRequest();
  const key = GOOGLE_OAUTH_REQUEST_PREFIX + state;
  const stored = sessionStorage.getItem(key);
  sessionStorage.removeItem(key);
  if (!stored) throw invalidRequest();
  const request: unknown = JSON.parse(stored);
  if (!request || typeof request !== 'object') throw invalidRequest();
  const value = request as Partial<PendingGoogleOAuthRequest>;
  if (
    value.state !== state ||
    typeof value.nonce !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value.nonce) ||
    typeof value.createdAt !== 'number' ||
    !Number.isFinite(value.createdAt) ||
    value.createdAt > Date.now() ||
    Date.now() - value.createdAt > GOOGLE_OAUTH_REQUEST_TTL_MS ||
    (value.intent !== 'login' && value.intent !== 'link') ||
    (value.intent === 'link' &&
      (typeof value.accountEmail !== 'string' || !value.accountEmail.trim()))
  ) throw invalidRequest();
  return {
    state,
    nonce: value.nonce,
    createdAt: value.createdAt,
    intent: value.intent,
    accountEmail: typeof value.accountEmail === 'string' ? value.accountEmail : null,
    nextPath: getSafeNextPath(value.nextPath),
  };
}

function readProfile(idToken: string, request: PendingGoogleOAuthRequest): GoogleOAuthProfile {
  const profile = decodeGoogleIdToken(idToken);
  if (
    typeof profile?.email !== 'string' ||
    !profile.email.trim() ||
    profile.nonce !== request.nonce
  ) throw invalidRequest();
  return {
    email: profile.email,
    name: typeof profile.name === 'string' ? profile.name : undefined,
    picture: typeof profile.picture === 'string' ? profile.picture : undefined,
    idToken,
    credential: idToken,
  };
}

export function requestGoogleOAuth(
  clientId: string,
  options: GoogleOAuthRequestOptions = {},
): Promise<GoogleOAuthProfile> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No disponible en el servidor.'));
  const request: PendingGoogleOAuthRequest = {
    state: randomValue(),
    nonce: randomValue(),
    createdAt: Date.now(),
    intent: options.intent ?? 'login',
    accountEmail: options.accountEmail?.trim().toLowerCase() ?? null,
    nextPath: getSafeNextPath(
      new URLSearchParams(window.location.search).get('next') ||
      sessionStorage.getItem('umssy_post_login_redirect'),
    ),
  };
  if (request.intent === 'link' && !request.accountEmail) return Promise.reject(invalidRequest());
  const key = GOOGLE_OAUTH_REQUEST_PREFIX + request.state;
  sessionStorage.setItem(key, JSON.stringify(request));
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: window.location.origin + GOOGLE_OAUTH_CALLBACK_PATH,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce: request.nonce,
    state: request.state,
    prompt: 'select_account',
  }).toString();

  return new Promise((resolve, reject) => {
    let popup: Window | null = null;
    let settled = false;
    let closedAt: number | null = null;
    let interval: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      clearInterval(interval);
      clearTimeout(timeout);
    };
    const finish = (idToken?: string, error?: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        const stored = consumeRequest(request.state);
        if (error) throw new Error('Se canceló el acceso con Google. Inténtalo de nuevo.');
        if (!idToken) throw invalidRequest();
        resolve(readProfile(idToken, stored));
      } catch (cause) {
        reject(cause);
      }
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== popup) return;
      const data: unknown = event.data;
      if (!data || typeof data !== 'object') return;
      const response = data as { type?: unknown; state?: unknown; idToken?: unknown; error?: unknown };
      if (response.type !== GOOGLE_OAUTH_MESSAGE_TYPE || response.state !== request.state) return;
      finish(
        typeof response.idToken === 'string' ? response.idToken : undefined,
        typeof response.error === 'string' ? response.error : undefined,
      );
    };
    window.addEventListener('message', onMessage);
    try {
      popup = window.open(url.href, 'umssy-google-oauth-popup', 'width=520,height=630,menubar=no,status=no,toolbar=no');
      if (!popup) {
        cleanup();
        window.location.assign(url.href);
        return;
      }
      interval = setInterval(() => {
        if (!popup?.closed) return;
        closedAt ??= Date.now();
        if (Date.now() - closedAt >= 400) finish(undefined, 'closed');
      }, 200);
      timeout = setTimeout(() => finish(undefined, 'timeout'), GOOGLE_OAUTH_REQUEST_TTL_MS);
    } catch {
      finish(undefined, 'unavailable');
    }
  });
}

export function handleGoogleOAuthCallback(): GoogleOAuthCallbackResult {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const state = params.get('state') ?? '';
  const idToken = params.get('id_token') ?? '';
  const error = params.get('error') ?? '';
  window.history.replaceState(null, '', window.location.pathname);
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({
      type: GOOGLE_OAUTH_MESSAGE_TYPE,
      state,
      idToken: idToken || undefined,
      error: error || undefined,
    }, window.location.origin);
    window.close();
    return { kind: 'popup' };
  }
  const request = consumeRequest(state);
  if (error) throw new Error('Se canceló el acceso con Google. Inténtalo de nuevo.');
  if (!idToken) throw invalidRequest();
  return { kind: 'redirect', request, profile: readProfile(idToken, request) };
}
