import { describe, expect, it, vi } from 'vitest';
import { AuthController } from '../controllers/auth.controller.js';
import { SessionExpiredException } from '../exceptions/index.js';

function buildRefreshTokens() {
  return {
    startFromLogin: vi
      .fn()
      .mockResolvedValue({ refreshToken: 'refresh', refreshMaxAgeMs: 900_000 }),
    rotate: vi.fn(),
    revokeByToken: vi.fn().mockResolvedValue(undefined),
  };
}

describe('AuthController', () => {
  it('delega el login al servicio con el cuerpo recibido', async () => {
    const authService = {
      login: vi
        .fn()
        .mockResolvedValue({ accessToken: 'token', roleTag: 'titulado' }),
      getAccessTokenMaxAgeMs: vi.fn().mockReturnValue(1000),
    };
    const controller = new AuthController(
      authService as any,
      buildRefreshTokens() as any,
    );
    const response = { cookie: vi.fn() };

    const body = {
      email: 'prueba@umss.edu.bo',
      password: 'Prueba123',
      roleTag: 'titulado' as const,
    };
    const result = await controller.login(body, response as any);

    expect(authService.login).toHaveBeenCalledWith(body);
    expect(result).toEqual({ accessToken: 'token', roleTag: 'titulado' });
  });

  it('sets the access token as an HttpOnly cookie on login', async () => {
    const authService = {
      login: vi.fn().mockResolvedValue({ accessToken: 'token' }),
      getAccessTokenMaxAgeMs: vi.fn().mockReturnValue(60_000),
    };
    const controller = new AuthController(
      authService as any,
      buildRefreshTokens() as any,
    );
    const response = { cookie: vi.fn() };

    await controller.login({} as any, response as any);

    expect(authService.getAccessTokenMaxAgeMs).toHaveBeenCalledWith('token');
    expect(response.cookie).toHaveBeenCalledWith(
      'umssy_access',
      'token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60_000,
      }),
    );
  });

  it('starts a refresh family on login and sets the refresh cookie', async () => {
    const authService = {
      login: vi.fn().mockResolvedValue({ accessToken: 'token' }),
      getAccessTokenMaxAgeMs: vi.fn().mockReturnValue(60_000),
    };
    const refreshTokens = buildRefreshTokens();
    const controller = new AuthController(
      authService as any,
      refreshTokens as any,
    );
    const response = { cookie: vi.fn() };

    await controller.login({} as any, response as any, 'Mozilla/5.0');

    expect(refreshTokens.startFromLogin).toHaveBeenCalledWith(
      'token',
      'Mozilla/5.0',
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'umssy_refresh',
      'refresh',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: 900_000,
      }),
    );
  });

  it('rotates the session on refresh without returning any token in the body', async () => {
    const refreshTokens = buildRefreshTokens();
    refreshTokens.rotate.mockResolvedValue({
      accessToken: 'new-access',
      accessMaxAgeMs: 900_000,
      refreshToken: 'new-refresh',
      refreshMaxAgeMs: 900_000,
      roleTag: 'titulado',
      roles: ['titulado'],
    });
    const controller = new AuthController({} as any, refreshTokens as any);
    const response = { cookie: vi.fn(), clearCookie: vi.fn() };
    const request = { cookies: { umssy_refresh: 'old-refresh' } };

    const result = await controller.refresh(
      response as any,
      request as any,
      'Mozilla/5.0',
    );

    expect(refreshTokens.rotate).toHaveBeenCalledWith(
      'old-refresh',
      'Mozilla/5.0',
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'umssy_access',
      'new-access',
      expect.objectContaining({ maxAge: 900_000 }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'umssy_refresh',
      'new-refresh',
      expect.objectContaining({ path: '/api/auth' }),
    );
    expect(result).toEqual({ roleTag: 'titulado', roles: ['titulado'] });
  });

  it('clears both cookies and rethrows when refresh is rejected', async () => {
    const refreshTokens = buildRefreshTokens();
    refreshTokens.rotate.mockRejectedValue(new SessionExpiredException());
    const controller = new AuthController({} as any, refreshTokens as any);
    const response = { cookie: vi.fn(), clearCookie: vi.fn() };

    await expect(
      controller.refresh(response as any, { cookies: {} } as any),
    ).rejects.toBeInstanceOf(SessionExpiredException);

    expect(refreshTokens.rotate).toHaveBeenCalledWith(undefined, undefined);
    expect(response.clearCookie).toHaveBeenCalledWith(
      'umssy_access',
      expect.anything(),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'umssy_refresh',
      expect.objectContaining({ path: '/api/auth' }),
    );
    expect(response.cookie).not.toHaveBeenCalled();
  });

  it('clears the access token cookie on logout', async () => {
    const controller = new AuthController({} as any, buildRefreshTokens() as any);
    const response = { clearCookie: vi.fn() };

    await controller.logout(response as any);

    expect(response.clearCookie).toHaveBeenCalledWith(
      'umssy_access',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
    expect(response.clearCookie.mock.calls[0]?.[1]).not.toHaveProperty(
      'maxAge',
    );
  });

  it('revokes the refresh family and clears the refresh cookie on logout', async () => {
    const refreshTokens = buildRefreshTokens();
    const controller = new AuthController({} as any, refreshTokens as any);
    const response = { clearCookie: vi.fn() };
    const request = { cookies: { umssy_refresh: 'refresh' } };

    await controller.logout(response as any, request as any);

    expect(refreshTokens.revokeByToken).toHaveBeenCalledWith('refresh');
    expect(response.clearCookie).toHaveBeenCalledWith(
      'umssy_refresh',
      expect.objectContaining({ path: '/api/auth' }),
    );
  });

  it('delegates session readback with the identity verified by the guard', () => {
    const user = {
      id: 'u-1',
      email: 'user@test.com',
      roles: ['titulado', 'mentor'],
    };
    const authService = { getSession: vi.fn().mockReturnValue(user) };
    const controller = new AuthController(
      authService as any,
      buildRefreshTokens() as any,
    );
    expect(controller.getSession(user)).toEqual(user);
    expect(authService.getSession).toHaveBeenCalledWith(user);
  });

  it('delega requestPasswordReset al servicio', async () => {
    const authService = {
      requestPasswordReset: vi
        .fn()
        .mockResolvedValue({ ok: true, message: 'Enviado' }),
    };
    const controller = new AuthController(
      authService as any,
      buildRefreshTokens() as any,
    );

    const body = { email: 'user@umss.edu' };
    const result = await controller.requestPasswordReset(body);

    expect(authService.requestPasswordReset).toHaveBeenCalledWith(body);
    expect(result).toEqual({ ok: true, message: 'Enviado' });
  });

  it('delega verifyPasswordReset al servicio', async () => {
    const authService = {
      verifyPasswordReset: vi
        .fn()
        .mockResolvedValue({ ok: true, message: 'Validado' }),
    };
    const controller = new AuthController(
      authService as any,
      buildRefreshTokens() as any,
    );

    const body = { email: 'user@umss.edu', code: '123456' };
    const result = await controller.verifyPasswordReset(body);

    expect(authService.verifyPasswordReset).toHaveBeenCalledWith(body);
    expect(result).toEqual({ ok: true, message: 'Validado' });
  });

  it('delega resetPassword al servicio', async () => {
    const authService = {
      resetPassword: vi
        .fn()
        .mockResolvedValue({ ok: true, message: 'Actualizado' }),
    };
    const controller = new AuthController(
      authService as any,
      buildRefreshTokens() as any,
    );

    const body = {
      email: 'user@umss.edu',
      code: '123456',
      password: 'NuevaPassword1',
    };
    const result = await controller.resetPassword(body);

    expect(authService.resetPassword).toHaveBeenCalledWith(body);
    expect(result).toEqual({ ok: true, message: 'Actualizado' });
  });
});
