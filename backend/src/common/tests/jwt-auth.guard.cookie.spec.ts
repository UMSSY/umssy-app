import type { ExecutionContext } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MissingUserException } from '../exceptions/missing-user.exception.js';
import { UnauthorizedSessionException } from '../exceptions/unauthorized-session.exception.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard.js';
import type { SessionService } from '../services/session.service.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.types.js';

const ORIGIN = 'https://front.example.test';
const USER_ID = '11111111-1111-4111-8111-111111111111';
const AUTH_USER = {
  id: USER_ID,
  email: 'user@test.com',
  roles: ['titulado'],
  company: null,
};

function createRequest(
  overrides: Partial<{
    method: string;
    headers: Record<string, string>;
    cookies: Record<string, string>;
  }> = {},
) {
  return {
    method: 'GET',
    headers: {},
    cookies: {},
    ...overrides,
  } as unknown as AuthenticatedRequest;
}

function createContext(request: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard with the session cookie', () => {
  const verifyAsync = vi.fn();
  const getAuthenticatedUser = vi.fn();
  const guard = new JwtAuthGuard(
    { verifyAsync } as unknown as JwtService,
    { getAuthenticatedUser } as unknown as SessionService,
  );

  beforeEach(() => {
    vi.stubEnv('CORS_ORIGIN', ORIGIN);
    verifyAsync.mockResolvedValue({
      sub: USER_ID,
      roleTag: 'titulado',
      roles: ['titulado'],
    });
    getAuthenticatedUser.mockResolvedValue(AUTH_USER);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('authenticates a read request that only carries the cookie', async () => {
    const request = createRequest({ cookies: { umssy_access: 'cookie.jwt' } });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(verifyAsync).toHaveBeenCalledWith('cookie.jwt');
    expect(request.user).toEqual(AUTH_USER);
  });

  it('authenticates a cookie write that comes from an allowed origin', async () => {
    const request = createRequest({
      method: 'POST',
      headers: { origin: ORIGIN },
      cookies: { umssy_access: 'cookie.jwt' },
    });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it.each([
    ['without an Origin header', {}],
    ['from another origin', { origin: 'https://evil.example.test' }],
  ])('rejects a cookie write %s', async (_label, headers) => {
    const request = createRequest({
      method: 'DELETE',
      headers,
      cookies: { umssy_access: 'cookie.jwt' },
    });

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedSessionException);
    expect(verifyAsync).not.toHaveBeenCalled();
  });

  it('does not require an Origin for writes authenticated with the header', async () => {
    const request = createRequest({
      method: 'POST',
      headers: { authorization: 'Bearer header.jwt' },
      cookies: { umssy_access: 'cookie.jwt' },
    });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(verifyAsync).toHaveBeenCalledWith('header.jwt');
  });

  it('rejects an invalid cookie token', async () => {
    verifyAsync.mockRejectedValue(new Error('jwt malformed'));
    const request = createRequest({ cookies: { umssy_access: 'bad' } });

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedSessionException);
  });

  it('keeps reporting a missing user when there is no credential', async () => {
    await expect(
      guard.canActivate(createContext(createRequest())),
    ).rejects.toBeInstanceOf(MissingUserException);
  });

  describe('OptionalJwtAuthGuard', () => {
    const optional = new OptionalJwtAuthGuard(guard);

    it('identifies the user from the cookie', async () => {
      const request = createRequest({
        cookies: { umssy_access: 'cookie.jwt' },
      });

      await expect(optional.canActivate(createContext(request))).resolves.toBe(
        true,
      );
      expect(request.user).toEqual(AUTH_USER);
    });

    it('lets an anonymous request through', async () => {
      const request = createRequest();

      await expect(optional.canActivate(createContext(request))).resolves.toBe(
        true,
      );
      expect(request.user).toBeUndefined();
    });

    it('treats a forged cookie write as anonymous instead of failing', async () => {
      const request = createRequest({
        method: 'POST',
        headers: { origin: 'https://evil.example.test' },
        cookies: { umssy_access: 'cookie.jwt' },
      });

      await expect(optional.canActivate(createContext(request))).resolves.toBe(
        true,
      );
      expect(request.user).toBeUndefined();
    });
  });
});
