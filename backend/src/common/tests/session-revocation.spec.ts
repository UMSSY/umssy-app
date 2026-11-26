import type { ExecutionContext } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard.js';
import { SessionRepository } from '../repositories/session.repository.js';
import { SessionService } from '../services/session.service.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.types.js';
import type { LoginJwtPayload } from '../types/login-jwt-payload.types.js';
import { PasswordChangedException } from '../exceptions/password-changed.exception.js';
import { SessionRevokedException } from '../exceptions/session-revoked.exception.js';
import { UnauthorizedSessionException } from '../exceptions/unauthorized-session.exception.js';
import { UserInactiveException } from '../exceptions/user-inactive.exception.js';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';
const ACTIVE_USER = {
  id: USER_ID,
  email: 'user@umss.test',
  isActive: true,
  company: null,
  roles: [{ role: { name: 'titulado' } }],
};

function build(options: { revoked?: { revokedReason: string | null } | null; user?: unknown } = {}) {
  const findFirstSession = vi.fn().mockResolvedValue(options.revoked ?? null);
  const findFirstUser = vi.fn().mockResolvedValue(options.user ?? ACTIVE_USER);
  const prisma = {
    refreshToken: { findFirst: findFirstSession },
    user: { findFirst: findFirstUser },
  };
  const sessionService = new SessionService(new SessionRepository(prisma as never));
  const verifyAsync = vi.fn<(token: string) => Promise<LoginJwtPayload>>();
  const guard = new JwtAuthGuard({ verifyAsync } as unknown as JwtService, sessionService);
  return { guard, sessionService, verifyAsync, findFirstSession, findFirstUser };
}

function context(request: Partial<AuthenticatedRequest>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const bearer = () => ({ headers: { authorization: 'Bearer signed.jwt.token' } }) as AuthenticatedRequest;

describe('SessionService.assertSessionActive', () => {
  it('acepta una sesión cuya familia de refresh no está revocada', async () => {
    const { sessionService, findFirstSession } = build();

    await expect(sessionService.assertSessionActive(SESSION_ID)).resolves.toBeUndefined();
    expect(findFirstSession).toHaveBeenCalledWith({
      where: { familyId: SESSION_ID, revokedAt: { not: null } },
      select: { revokedReason: true },
    });
  });

  it.each(['logout', 'reuse_detected', 'user_inactive', 'role_removed', null])(
    'rechaza con SESSION_REVOKED una familia revocada por %s',
    async (revokedReason) => {
      const { sessionService } = build({ revoked: { revokedReason } });

      const error = await sessionService.assertSessionActive(SESSION_ID).catch((cause: unknown) => cause);

      expect(error).toBeInstanceOf(SessionRevokedException);
      expect(error).toMatchObject({
        statusCode: 401,
        code: 'SESSION_REVOKED',
        message: 'Tu sesión se cerró. Inicia sesión nuevamente.',
      });
    },
  );

  it('rechaza con PASSWORD_CHANGED una familia revocada por cambio de contraseña', async () => {
    const { sessionService } = build({ revoked: { revokedReason: 'password_changed' } });

    const error = await sessionService.assertSessionActive(SESSION_ID).catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(PasswordChangedException);
    expect(error).toMatchObject({ statusCode: 401, code: 'PASSWORD_CHANGED' });
  });

  it.each([undefined, null, '', 'family-1', 123, '2222222-2222-4222-8222-222222222222'])(
    'rechaza un identificador de sesión inválido (%s) sin consultar la base',
    async (sessionId) => {
      const { sessionService, findFirstSession } = build();

      await expect(sessionService.assertSessionActive(sessionId)).rejects.toBeInstanceOf(
        UnauthorizedSessionException,
      );
      expect(findFirstSession).not.toHaveBeenCalled();
    },
  );
});

describe('JwtAuthGuard: revocación por petición', () => {
  it('con sid vigente deja pasar y hace una consulta indexada por la familia', async () => {
    const { guard, verifyAsync, findFirstSession } = build();
    verifyAsync.mockResolvedValue({ sub: USER_ID, roleTag: 'titulado', sid: SESSION_ID });
    const request = bearer();

    await expect(guard.canActivate(context(request))).resolves.toBe(true);

    expect(findFirstSession).toHaveBeenCalledTimes(1);
    expect(request.user).toMatchObject({ id: USER_ID, roles: ['titulado'] });
  });

  it('con la familia revocada responde 401 SESSION_REVOKED sin cargar al usuario', async () => {
    const { guard, verifyAsync, findFirstUser } = build({ revoked: { revokedReason: 'logout' } });
    verifyAsync.mockResolvedValue({ sub: USER_ID, roleTag: 'titulado', sid: SESSION_ID });

    await expect(guard.canActivate(context(bearer()))).rejects.toMatchObject({
      statusCode: 401,
      code: 'SESSION_REVOKED',
    });
    expect(findFirstUser).not.toHaveBeenCalled();
  });

  it('tras cambiar la contraseña el token anterior recibe 401 PASSWORD_CHANGED', async () => {
    const { guard, verifyAsync } = build({ revoked: { revokedReason: 'password_changed' } });
    verifyAsync.mockResolvedValue({ sub: USER_ID, roleTag: 'titulado', sid: SESSION_ID });

    await expect(guard.canActivate(context(bearer()))).rejects.toMatchObject({
      statusCode: 401,
      code: 'PASSWORD_CHANGED',
    });
  });

  it('también aplica cuando el token llega solo por la cookie de acceso', async () => {
    const { guard, verifyAsync } = build({ revoked: { revokedReason: 'logout' } });
    verifyAsync.mockResolvedValue({ sub: USER_ID, roleTag: 'titulado', sid: SESSION_ID });
    const request = { method: 'GET', headers: {}, cookies: { umssy_access: 'cookie.jwt.token' } } as unknown as AuthenticatedRequest;

    await expect(guard.canActivate(context(request))).rejects.toMatchObject({ code: 'SESSION_REVOKED' });
  });

  it('acepta un token sin sid (emitido antes del cambio) sin consultar la familia', async () => {
    const { guard, verifyAsync, findFirstSession } = build({ revoked: { revokedReason: 'logout' } });
    verifyAsync.mockResolvedValue({ sub: USER_ID, roleTag: 'titulado' });

    await expect(guard.canActivate(context(bearer()))).resolves.toBe(true);
    expect(findFirstSession).not.toHaveBeenCalled();
  });

  it('rechaza un sid con formato inválido aunque la firma sea válida', async () => {
    const { guard, verifyAsync, findFirstSession } = build();
    verifyAsync.mockResolvedValue({ sub: USER_ID, roleTag: 'titulado', sid: 'no-es-uuid' });

    await expect(guard.canActivate(context(bearer()))).rejects.toBeInstanceOf(UnauthorizedSessionException);
    expect(findFirstSession).not.toHaveBeenCalled();
  });

  it('con sid y usuario inactivo responde 401 SESSION_REVOKED', async () => {
    const { guard, verifyAsync } = build({ user: { ...ACTIVE_USER, isActive: false } });
    verifyAsync.mockResolvedValue({ sub: USER_ID, roleTag: 'titulado', sid: SESSION_ID });

    await expect(guard.canActivate(context(bearer()))).rejects.toMatchObject({
      statusCode: 401,
      code: 'SESSION_REVOKED',
    });
  });

  it('sin sid mantiene el 403 USER_INACTIVE de siempre para un usuario inactivo', async () => {
    const { guard, verifyAsync } = build({ user: { ...ACTIVE_USER, isActive: false } });
    verifyAsync.mockResolvedValue({ sub: USER_ID, roleTag: 'titulado' });

    await expect(guard.canActivate(context(bearer()))).rejects.toBeInstanceOf(UserInactiveException);
  });
});

describe('OptionalJwtAuthGuard con revocación', () => {
  it('una ruta pública sin credenciales no consulta nada', async () => {
    const { guard, findFirstSession } = build();
    const optional = new OptionalJwtAuthGuard(guard);

    await expect(optional.canActivate(context({ headers: {} } as AuthenticatedRequest))).resolves.toBe(true);
    expect(findFirstSession).not.toHaveBeenCalled();
  });

  it('un token revocado en una ruta opcional sigue como anónimo', async () => {
    const { guard, verifyAsync } = build({ revoked: { revokedReason: 'logout' } });
    verifyAsync.mockResolvedValue({ sub: USER_ID, roleTag: 'titulado', sid: SESSION_ID });
    const optional = new OptionalJwtAuthGuard(guard);
    const request = bearer();

    await expect(optional.canActivate(context(request))).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });
});
