import { JwtService } from '@nestjs/jwt';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { UnauthorizedSessionException } from '../../../common/exceptions/unauthorized-session.exception.js';
import { GoogleLinkTokenService } from '../services/google-link-token.service.js';
import {
  GoogleLinkTokenExpiredException,
  GoogleLinkTokenInvalidException,
} from '../exceptions/index.js';

const SECRET = 'google-link-test-secret';
const claims = {
  userId: 'u-1',
  googleSub: 'google-sub-1',
  email: 'dania@umss.edu',
  picture: 'https://photo.url',
};

describe('GoogleLinkTokenService', () => {
  const jwt = new JwtService({ secret: SECRET, signOptions: { expiresIn: '8h' } });
  const service = new GoogleLinkTokenService(jwt);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-25T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('firma un token con propósito google-link que vence en 5 minutos', () => {
    const token = service.sign(claims);
    const decoded = jwt.decode<Record<string, unknown>>(token);

    expect(decoded).toMatchObject({ purpose: 'google-link', ...claims });
    expect((decoded.exp as number) - (decoded.iat as number)).toBe(300);
    expect(decoded).not.toHaveProperty('sub');
    expect(decoded).not.toHaveProperty('roleTag');
  });

  it('verifica un token vigente y devuelve solo los datos de vinculación', () => {
    expect(service.verify(service.sign(claims))).toEqual(claims);
    const { picture: _picture, ...withoutPicture } = claims;
    expect(service.verify(service.sign(withoutPicture))).toEqual(withoutPicture);
  });

  it('un token vencido responde «Vuelve a iniciar con Google»', () => {
    const token = service.sign(claims);
    vi.setSystemTime(new Date('2026-11-25T12:05:01Z'));

    const error = (() => {
      try {
        service.verify(token);
      } catch (e) {
        return e;
      }
    })();
    expect(error).toBeInstanceOf(GoogleLinkTokenExpiredException);
    expect((error as GoogleLinkTokenExpiredException).message).toBe('Vuelve a iniciar con Google');
    expect((error as GoogleLinkTokenExpiredException).statusCode).toBe(401);
  });

  it('sigue vigente justo antes de los 5 minutos', () => {
    const token = service.sign(claims);
    vi.setSystemTime(new Date('2026-11-25T12:04:59Z'));
    expect(service.verify(token).userId).toBe('u-1');
  });

  it('rechaza el access token de sesión (otro propósito)', () => {
    const accessToken = jwt.sign({ sub: 'u-1', roleTag: 'titulado', roles: ['titulado'] });
    expect(() => service.verify(accessToken)).toThrow(GoogleLinkTokenInvalidException);
  });

  it.each([
    ['otro propósito', { ...claims, purpose: 'password-reset' }],
    ['sin userId', { purpose: 'google-link', googleSub: 's', email: 'a@b.com' }],
    ['sin googleSub', { purpose: 'google-link', userId: 'u', email: 'a@b.com' }],
    ['sin correo', { purpose: 'google-link', userId: 'u', googleSub: 's' }],
    ['userId vacío', { ...claims, purpose: 'google-link', userId: '  ' }],
  ])('rechaza un token firmado con %s', (_label, payload) => {
    expect(() => service.verify(jwt.sign(payload))).toThrow(GoogleLinkTokenInvalidException);
  });

  it('rechaza tokens firmados con otro secreto y cadenas que no son tokens', () => {
    const foreign = new JwtService({ secret: 'otro' }).sign({ ...claims, purpose: 'google-link' });
    expect(() => service.verify(foreign)).toThrow(GoogleLinkTokenInvalidException);
    expect(() => service.verify('no-es-un-jwt')).toThrow(GoogleLinkTokenInvalidException);
  });

  it('rechaza una carga nula', () => {
    const nullPayload = new GoogleLinkTokenService({ verify: () => null } as unknown as JwtService);
    expect(() => nullPayload.verify('x')).toThrow(GoogleLinkTokenInvalidException);
  });

  it('el guard JWT de sesión no acepta el token de vinculación', async () => {
    const guard = new JwtAuthGuard(jwt, {
      assertSessionActive: vi.fn(),
      getAuthenticatedUser: vi.fn().mockResolvedValue({ id: 'u-1' }),
    } as never);
    const token = service.sign(claims);

    for (const request of [
      { headers: { authorization: `Bearer ${token}` }, method: 'GET' },
      { headers: {}, cookies: { access_token: token }, method: 'GET' },
    ]) {
      const context = { switchToHttp: () => ({ getRequest: () => request }) } as never;
      await expect(guard.canActivate(context)).rejects.toBeDefined();
    }
    await expect(
      guard.canActivate({
        switchToHttp: () => ({ getRequest: () => ({ headers: { authorization: `Bearer ${token}` }, method: 'GET' }) }),
      } as never),
    ).rejects.toBeInstanceOf(UnauthorizedSessionException);
  });
});
