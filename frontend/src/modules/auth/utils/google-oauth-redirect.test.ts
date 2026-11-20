import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GOOGLE_OAUTH_CALLBACK_PATH,
  GOOGLE_OAUTH_MESSAGE_TYPE,
  GOOGLE_OAUTH_REQUEST_PREFIX,
  GOOGLE_OAUTH_REQUEST_TTL_MS,
  handleGoogleOAuthCallback,
  requestGoogleOAuth,
} from './google-oauth-redirect';
import type { PendingGoogleOAuthRequest } from '../types/google-oauth-flow.types';

const credential = (nonce: string, email = 'qa@gmail.com') =>
  `header.${btoa(JSON.stringify({ email, nonce, name: 'QA' }))}.signature`;

function savedRequest(url: URL): PendingGoogleOAuthRequest {
  return JSON.parse(sessionStorage.getItem(GOOGLE_OAUTH_REQUEST_PREFIX + url.searchParams.get('state'))!);
}

function startPopup() {
  const popup = { closed: false } as Window;
  const open = vi.spyOn(window, 'open').mockReturnValue(popup);
  const promise = requestGoogleOAuth('qa.apps.googleusercontent.com');
  const url = new URL(String(open.mock.calls[0][0]));
  return { popup, promise, url, request: savedRequest(url) };
}

function deliver(popup: Window, state: string, idToken: string, origin = window.location.origin) {
  window.dispatchEvent(new MessageEvent('message', {
    origin,
    source: popup,
    data: { type: GOOGLE_OAUTH_MESSAGE_TYPE, state, idToken },
  }));
}

function seedRedirect(overrides: Partial<PendingGoogleOAuthRequest> = {}) {
  const request: PendingGoogleOAuthRequest = {
    state: 'a'.repeat(64), nonce: 'b'.repeat(64), createdAt: Date.now(),
    intent: 'login', accountEmail: null, nextPath: '/profile', ...overrides,
  };
  sessionStorage.setItem(GOOGLE_OAUTH_REQUEST_PREFIX + request.state, JSON.stringify(request));
  const token = credential(request.nonce);
  window.history.replaceState(null, '', `${GOOGLE_OAUTH_CALLBACK_PATH}#state=${request.state}&id_token=${token}`);
  return { request, token };
}

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  localStorage.clear();
  window.history.replaceState(null, '', '/login');
  Object.defineProperty(window, 'opener', { value: null, configurable: true, writable: true });
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/login');
  Object.defineProperty(window, 'opener', { value: null, configurable: true, writable: true });
});

describe('Google OAuth popup', () => {
  it('uses the dedicated callback and binds the response to the exact window, origin, state and nonce', async () => {
    const { popup, promise, url, request } = startPopup();
    expect(url.searchParams.get('redirect_uri')).toBe(window.location.origin + GOOGLE_OAUTH_CALLBACK_PATH);
    expect(url.searchParams.get('response_type')).toBe('id_token');
    expect(request.state).toMatch(/^[a-f0-9]{64}$/);
    expect(request.nonce).toMatch(/^[a-f0-9]{64}$/);
    const token = credential(request.nonce);
    const settled = vi.fn();
    void promise.then(settled);
    deliver(popup, request.state, token, 'https://other.example');
    deliver({ closed: false } as Window, request.state, token);
    deliver(popup, 'wrong-state', token);
    deliver(popup, '', token);
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();
    deliver(popup, request.state, token);
    await expect(promise).resolves.toMatchObject({ email: 'qa@gmail.com', idToken: token });
    expect(sessionStorage.getItem(GOOGLE_OAUTH_REQUEST_PREFIX + request.state)).toBeNull();
    expect(JSON.stringify(Object.values(localStorage))).not.toContain(token);
    expect(JSON.stringify(Object.values(sessionStorage))).not.toContain(token);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects an otherwise matching response with a different nonce', async () => {
    const { popup, promise, request } = startPopup();
    deliver(popup, request.state, credential('another-nonce'));
    await expect(promise).rejects.toThrow('no es válido');
    expect(sessionStorage.getItem(GOOGLE_OAUTH_REQUEST_PREFIX + request.state)).toBeNull();
  });

  it('cancels and removes its pending request when the popup closes', async () => {
    const { popup, promise, request } = startPopup();
    const rejected = expect(promise).rejects.toThrow('Se canceló');
    Object.assign(popup, { closed: true });
    await vi.advanceTimersByTimeAsync(1000);
    await rejected;
    expect(sessionStorage.getItem(GOOGLE_OAUTH_REQUEST_PREFIX + request.state)).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('expires a pending request instead of leaving a permanent loading state', async () => {
    const { promise, request } = startPopup();
    const rejected = expect(promise).rejects.toThrow('Se canceló');
    await vi.advanceTimersByTimeAsync(GOOGLE_OAUTH_REQUEST_TTL_MS);
    await rejected;
    expect(sessionStorage.getItem(GOOGLE_OAUTH_REQUEST_PREFIX + request.state)).toBeNull();
  });

  it('preserves link intent and target email without persisting a credential', async () => {
    const popup = { closed: false } as Window;
    const open = vi.spyOn(window, 'open').mockReturnValue(popup);
    const promise = requestGoogleOAuth('qa.apps.googleusercontent.com', { intent: 'link', accountEmail: ' QA@GMAIL.COM ' });
    const request = savedRequest(new URL(String(open.mock.calls[0][0])));
    expect(request).toMatchObject({ intent: 'link', accountEmail: 'qa@gmail.com' });
    deliver(popup, request.state, credential(request.nonce));
    await expect(promise).resolves.toMatchObject({ email: 'qa@gmail.com' });
  });

  it('rejects linking without a target account before opening Google', async () => {
    const open = vi.spyOn(window, 'open');
    await expect(requestGoogleOAuth('client', { intent: 'link' })).rejects.toThrow('no es válido');
    expect(open).not.toHaveBeenCalled();
  });
});

describe('Google OAuth callback route', () => {
  it('returns a popup credential only to its same-origin opener and clears the URL', () => {
    const postMessage = vi.fn();
    const close = vi.spyOn(window, 'close').mockImplementation(() => {});
    Object.defineProperty(window, 'opener', { value: { closed: false, postMessage }, configurable: true });
    const token = credential('n');
    window.history.replaceState(null, '', `${GOOGLE_OAUTH_CALLBACK_PATH}#state=popup-state&id_token=${token}`);
    expect(handleGoogleOAuthCallback()).toEqual({ kind: 'popup' });
    expect(postMessage).toHaveBeenCalledWith({ type: GOOGLE_OAUTH_MESSAGE_TYPE, state: 'popup-state', idToken: token, error: undefined }, window.location.origin);
    expect(close).toHaveBeenCalledOnce();
    expect(window.location.hash).toBe('');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('completes a full-page return once and preserves its safe destination', () => {
    const { request, token } = seedRedirect();
    expect(handleGoogleOAuthCallback()).toMatchObject({ kind: 'redirect', request, profile: { email: 'qa@gmail.com', idToken: token } });
    expect(window.location.hash).toBe('');
    expect(sessionStorage.getItem(GOOGLE_OAUTH_REQUEST_PREFIX + request.state)).toBeNull();
    window.history.replaceState(null, '', `${GOOGLE_OAUTH_CALLBACK_PATH}#state=${request.state}&id_token=${token}`);
    expect(() => handleGoogleOAuthCallback()).toThrow('no es válido');
  });

  it('preserves a linking operation through a full-page redirect', () => {
    seedRedirect({ intent: 'link', accountEmail: 'qa@gmail.com' });
    expect(handleGoogleOAuthCallback()).toMatchObject({ kind: 'redirect', request: { intent: 'link', accountEmail: 'qa@gmail.com' } });
  });

  it('discards an external post-login destination', () => {
    seedRedirect({ nextPath: 'https://other.example' });
    expect(handleGoogleOAuthCallback()).toMatchObject({ kind: 'redirect', request: { nextPath: null } });
  });

  it('rejects an expired full-page return before authentication', () => {
    seedRedirect({ createdAt: Date.now() - GOOGLE_OAUTH_REQUEST_TTL_MS - 1 });
    expect(() => handleGoogleOAuthCallback()).toThrow('venció');
    expect(window.location.hash).toBe('');
  });

  it('rejects a full-page credential with the wrong nonce', () => {
    const { request } = seedRedirect();
    window.history.replaceState(null, '', `${GOOGLE_OAUTH_CALLBACK_PATH}#state=${request.state}&id_token=${credential('wrong')}`);
    expect(() => handleGoogleOAuthCallback()).toThrow('no es válido');
  });

  it('does not authenticate an unsolicited callback', () => {
    window.history.replaceState(null, '', `${GOOGLE_OAUTH_CALLBACK_PATH}#id_token=${credential('wrong')}`);
    expect(() => handleGoogleOAuthCallback()).toThrow('no es válido');
    expect(window.location.hash).toBe('');
  });

  it('handles Google denial without retaining the pending request', () => {
    const { request } = seedRedirect();
    window.history.replaceState(null, '', `${GOOGLE_OAUTH_CALLBACK_PATH}#state=${request.state}&error=access_denied`);
    expect(() => handleGoogleOAuthCallback()).toThrow('Se canceló');
    expect(sessionStorage.getItem(GOOGLE_OAUTH_REQUEST_PREFIX + request.state)).toBeNull();
  });
});
