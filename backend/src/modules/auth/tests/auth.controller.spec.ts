import type { AuthService } from '../services/auth.service.js';
import type { RefreshTokenService } from '../services/refresh-token.service.js';
import type { CredentialLimitsService } from '../services/credential-limits.service.js';
import type { CredentialOperation } from '../types/credential-operation.types.js';
import { describe, expect, it, vi } from 'vitest';
import { AuthController } from '../controllers/auth.controller.js';
import {
  SessionExpiredException,
  GoogleEmailMismatchException,
} from '../exceptions/index.js';

function buildRefreshTokens() {
  return {
    startFromLogin: vi
      .fn()
      .mockResolvedValue({ refreshToken: 'refresh', refreshMaxAgeMs: 900_000 }),
    rotate: vi.fn(),
    revokeByToken: vi.fn().mockResolvedValue(undefined),
    getAbsoluteExpiry: vi.fn().mockResolvedValue(null),
  };
}

function buildController(
  auth: unknown,
  refresh: unknown,
  googleAuth: unknown = { verifyCredential: vi.fn() },
) {
  const limits = {
    run<T>(
      _operation: CredentialOperation,
      _email: string,
      action: () => Promise<T>,
    ): Promise<T> {
      return action();
    },
  };
  return new AuthController(
    auth as AuthService,
    refresh as RefreshTokenService,
    limits as unknown as CredentialLimitsService,
    googleAuth as any,
  );
}

describe('AuthController', () => {
  it('delega el login al servicio con el cuerpo recibido', async () => {
    const authService = {
      login: vi
        .fn()
        .mockResolvedValue({ accessToken: 'token', roleTag: 'titulado' }),
      getAccessTokenMaxAgeMs: vi.fn().mockReturnValue(1000),
    };
    const controller = buildController(
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
    const controller = buildController(
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
    const controller = buildController(
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

  it('rotates the session on refresh and answers with the renewed access token', async () => {
    const refreshTokens = buildRefreshTokens();
    refreshTokens.rotate.mockResolvedValue({
      accessToken: 'new-access',
      accessMaxAgeMs: 900_000,
      refreshToken: 'new-refresh',
      refreshMaxAgeMs: 900_000,
      roleTag: 'titulado',
      roles: ['titulado'],
    });
    const controller = buildController({} as any, refreshTokens as any);
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
    expect(result).toEqual({
      accessToken: 'new-access',
      roleTag: 'titulado',
      roles: ['titulado'],
    });
  });

  it('clears both cookies and rethrows when refresh is rejected', async () => {
    const refreshTokens = buildRefreshTokens();
    refreshTokens.rotate.mockRejectedValue(new SessionExpiredException());
    const controller = buildController({} as any, refreshTokens as any);
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
    const controller = buildController({} as any, buildRefreshTokens() as any);
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
    const controller = buildController({} as any, refreshTokens as any);
    const response = { clearCookie: vi.fn() };
    const request = { cookies: { umssy_refresh: 'refresh' } };

    await controller.logout(response as any, request as any);

    expect(refreshTokens.revokeByToken).toHaveBeenCalledWith('refresh');
    expect(response.clearCookie).toHaveBeenCalledWith(
      'umssy_refresh',
      expect.objectContaining({ path: '/api/auth' }),
    );
  });

  it('delegates session readback with the identity verified by the guard', async () => {
    const user = {
      id: 'u-1',
      email: 'user@test.com',
      roles: ['titulado', 'mentor'],
    };
    const authService = { getSession: vi.fn().mockReturnValue(user) };
    const controller = buildController(
      authService as any,
      buildRefreshTokens() as any,
    );
    await expect(controller.getSession(user)).resolves.toEqual(user);
    expect(authService.getSession).toHaveBeenCalledWith(user, null);
  });

  it('delega requestPasswordReset al servicio', async () => {
    const authService = {
      requestPasswordReset: vi
        .fn()
        .mockResolvedValue({ ok: true, message: 'Enviado' }),
    };
    const controller = buildController(
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
    const controller = buildController(
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
    const controller = buildController(
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

  describe('googleLogin', () => {
    it('falla con 401 si no se envía credencial o idToken', async () => {
      const controller = buildController({}, buildRefreshTokens());
      const response = { cookie: vi.fn() };

      await expect(
        controller.googleLogin({} as any, response as any),
      ).rejects.toThrow('Credencial de Google no proporcionada.');
    });

    it('verifica credencial, ejecuta loginWithGoogle, guarda cookies y devuelve resultado', async () => {
      const googleAuth = {
        verifyCredential: vi.fn().mockResolvedValue({
          email: 'dania@gmail.com',
          sub: '123456',
        }),
      };
      const authService = {
        loginWithGoogle: vi.fn().mockResolvedValue({
          accessToken: 'google-access-token',
          roleTag: 'titulado',
          roles: ['titulado'],
        }),
        getAccessTokenMaxAgeMs: vi.fn().mockReturnValue(900_000),
      };
      const refresh = buildRefreshTokens();
      const controller = buildController(authService, refresh, googleAuth);
      const response = { cookie: vi.fn() };

      const body = {
        credential: 'valid-google-jwt',
        roleTag: 'titulado' as const,
      };

      const result = await controller.googleLogin(body as any, response as any);

      expect(googleAuth.verifyCredential).toHaveBeenCalledWith('valid-google-jwt');
      expect(authService.loginWithGoogle).toHaveBeenCalledWith(
        { email: 'dania@gmail.com', sub: '123456' },
        'titulado',
      );
      expect(response.cookie).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'google-access-token',
        roleTag: 'titulado',
        roles: ['titulado'],
      });
    });
  });

  describe('googleLink', () => {
    it('falla con 400 si no se envía credencial', async () => {
      const controller = buildController({}, buildRefreshTokens());
      const user = { id: 'u-1', email: 'user@umss.edu', roles: ['titulado'] };

      await expect(
        controller.googleLink(user as any, {} as any),
      ).rejects.toThrow('Credencial de Google no proporcionada.');
    });

    it('falla con 400 si el correo verificado de Google no coincide con el del usuario autenticado', async () => {
      const googleAuth = {
        verifyCredential: vi.fn().mockResolvedValue({
          email: 'otro@gmail.com',
          sub: '9999',
        }),
      };
      const authService = {
        linkGoogle: vi.fn().mockRejectedValue(
          new GoogleEmailMismatchException(),
        ),
      };
      const controller = buildController(authService, buildRefreshTokens(), googleAuth);
      const user = { id: 'u-1', email: 'dania@umss.edu', roles: ['titulado'] };

      await expect(
        controller.googleLink(user as any, { credential: 'google-jwt' } as any),
      ).rejects.toThrow('La cuenta de Google no coincide con el correo de tu cuenta registrada.');
    });

    it('vincula exitosamente si el correo de Google coincide con el usuario autenticado', async () => {
      const googleAuth = {
        verifyCredential: vi.fn().mockResolvedValue({
          email: 'dania@umss.edu',
          sub: '9999',
        }),
      };
      const authService = {
        linkGoogle: vi.fn().mockResolvedValue({
          ok: true,
          detail: 'Cuenta vinculada exitosamente.',
        }),
      };
      const controller = buildController(authService, buildRefreshTokens(), googleAuth);
      const user = { id: 'u-1', email: 'dania@umss.edu', roles: ['titulado'] };

      const result = await controller.googleLink(user as any, { credential: 'google-jwt' } as any);

      expect(googleAuth.verifyCredential).toHaveBeenCalledWith('google-jwt');
      expect(authService.linkGoogle).toHaveBeenCalledWith(user, {
        email: 'dania@umss.edu',
        sub: '9999',
      });
      expect(result).toEqual({
        ok: true,
        detail: 'Cuenta vinculada exitosamente.',
      });
    });
  });

  it('documenta cada endpoint con un operationId OpenAPI único', () => {
    const methods = Object.getOwnPropertyNames(
      AuthController.prototype,
    ).filter((name) => name !== 'constructor');
    const operationIds = methods.map((name) => {
      const meta = Reflect.getMetadata(
        'swagger/apiOperation',
        (AuthController.prototype as unknown as Record<string, object>)[name],
      ) as { operationId?: string } | undefined;
      return meta?.operationId;
    });

    expect(methods).toHaveLength(9);
    expect(operationIds.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
    expect(new Set(operationIds).size).toBe(methods.length);
  });
});
