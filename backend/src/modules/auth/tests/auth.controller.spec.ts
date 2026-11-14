import { describe, expect, it, vi } from 'vitest';
import { AuthController } from '../controllers/auth.controller.js';

describe('AuthController', () => {
  it('delega el login al servicio con el cuerpo recibido', async () => {
    const authService = {
      login: vi
        .fn()
        .mockResolvedValue({ accessToken: 'token', roleTag: 'titulado' }),
      getAccessTokenMaxAgeMs: vi.fn().mockReturnValue(1000),
    };
    const controller = new AuthController(authService as any);
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
    const controller = new AuthController(authService as any);
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

  it('clears the access token cookie on logout', () => {
    const controller = new AuthController({} as any);
    const response = { clearCookie: vi.fn() };

    controller.logout(response as any);

    expect(response.clearCookie).toHaveBeenCalledWith(
      'umssy_access',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
    expect(response.clearCookie.mock.calls[0]?.[1]).not.toHaveProperty(
      'maxAge',
    );
  });

  it('delegates session readback with the identity verified by the guard', () => {
    const user = {
      id: 'u-1',
      email: 'user@test.com',
      roles: ['titulado', 'mentor'],
    };
    const authService = { getSession: vi.fn().mockReturnValue(user) };
    const controller = new AuthController(authService as any);
    expect(controller.getSession(user)).toEqual(user);
    expect(authService.getSession).toHaveBeenCalledWith(user);
  });

  it('delega requestPasswordReset al servicio', async () => {
    const authService = {
      requestPasswordReset: vi
        .fn()
        .mockResolvedValue({ ok: true, message: 'Enviado' }),
    };
    const controller = new AuthController(authService as any);

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
    const controller = new AuthController(authService as any);

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
    const controller = new AuthController(authService as any);

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
