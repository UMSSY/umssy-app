import type { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ZodValidationPipe } from 'nestjs-zod';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CredentialSecurityModule } from '../credential-security.module.js';
import { AuthController } from '../controllers/auth.controller.js';
import { GoogleAccountAlreadyLinkedException, InvalidCredentialsException } from '../exceptions/index.js';
import { AuthService } from '../services/auth.service.js';
import { GoogleAuthService } from '../services/google-auth.service.js';
import { GoogleLinkTokenService } from '../services/google-link-token.service.js';
import { RefreshTokenService } from '../services/refresh-token.service.js';

const SECRET = 'google-link-http-secret';
const claims = { userId: 'u-1', googleSub: 'sub-1', email: 'dania@umss.edu' };

describe('Vinculación de Google por HTTP', () => {
  let app: INestApplication;
  const auth = { loginWithGoogle: vi.fn(), confirmGoogleLink: vi.fn() };
  const google = { verifyCredential: vi.fn() };
  const refresh = { startFromLogin: vi.fn() };
  const jwt = new JwtService({ secret: SECRET });

  beforeEach(async () => {
    vi.resetAllMocks();
    google.verifyCredential.mockResolvedValue({ email: claims.email, sub: claims.googleSub });
    refresh.startFromLogin.mockResolvedValue({
      accessToken: 'session-access',
      accessMaxAgeMs: 60_000,
      refreshToken: 'refresh-test',
      refreshMaxAgeMs: 900_000,
    });

    const moduleRef = await Test.createTestingModule({
      imports: [CredentialSecurityModule, JwtModule.register({ secret: SECRET, signOptions: { expiresIn: '8h' } })],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: RefreshTokenService, useValue: refresh },
        { provide: GoogleAuthService, useValue: google },
        GoogleLinkTokenService,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  const login = () => request(app.getHttpServer()).post('/api/auth/google/login').send({ credential: 'g-token' });
  const confirm = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/api/auth/google/link/confirm').send(body);

  it('una cuenta sin vincular responde 200 sin cookies con un linkToken que no sirve como sesión', async () => {
    auth.loginWithGoogle.mockResolvedValue({ requiresLinking: true, claims });

    const response = await login();

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.body).toMatchObject({ requiresLinking: true, email: claims.email, emailVerified: true });
    expect(typeof response.body.linkToken).toBe('string');
    expect(response.body).not.toHaveProperty('accessToken');
    expect(refresh.startFromLogin).not.toHaveBeenCalled();
    expect(jwt.decode(response.body.linkToken)).toMatchObject({ purpose: 'google-link', ...claims });
  });

  it('requiresLinking no cuenta como intento fallido del límite de login', async () => {
    auth.loginWithGoogle.mockResolvedValue({ requiresLinking: true, claims });
    for (let attempt = 0; attempt < 8; attempt++) {
      expect((await login()).status).toBe(200);
    }
  });

  it('los intentos fallidos con Google sí llegan al límite de login', async () => {
    auth.loginWithGoogle.mockRejectedValue(new InvalidCredentialsException('Tu solicitud aún no fue aprobada'));
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 5; attempt++) statuses.push((await login()).status);
    expect(statuses.slice(0, 4)).toEqual([401, 401, 401, 401]);
    expect(statuses[4]).toBe(429);
  });

  it('confirmar con un token vigente vincula y abre la sesión con cookies', async () => {
    auth.loginWithGoogle.mockResolvedValue({ requiresLinking: true, claims });
    const { linkToken } = (await login()).body as { linkToken: string };
    auth.confirmGoogleLink.mockResolvedValue({ accessToken: 'raw', roleTag: 'titulado', roles: ['titulado'] });

    const response = await confirm({ linkToken, roleTag: 'titulado' });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.body).toMatchObject({ accessToken: 'session-access', roleTag: 'titulado' });
    expect(auth.confirmGoogleLink).toHaveBeenCalledWith(claims, 'titulado');
  });

  it('un token vencido responde 401 con «Vuelve a iniciar con Google» y no vincula', async () => {
    const expired = jwt.sign({ ...claims, purpose: 'google-link' }, { expiresIn: -10 });

    const response = await confirm({ linkToken: expired });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('GOOGLE_LINK_TOKEN_EXPIRED');
    expect(response.body.detail).toBe('Vuelve a iniciar con Google');
    expect(auth.confirmGoogleLink).not.toHaveBeenCalled();
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('un token de sesión (otro propósito) responde 401 y no vincula', async () => {
    const accessToken = jwt.sign({ sub: 'u-1', roleTag: 'titulado', roles: ['titulado'] });
    const response = await confirm({ linkToken: accessToken });
    expect(response.status).toBe(401);
    expect(response.body.code).toBe('GOOGLE_LINK_TOKEN_INVALID');
    expect(auth.confirmGoogleLink).not.toHaveBeenCalled();
  });

  it('exige el linkToken en el cuerpo', async () => {
    expect((await confirm({})).status).toBe(400);
  });

  it('un sub ya vinculado a otro usuario responde 409', async () => {
    auth.loginWithGoogle.mockResolvedValue({ requiresLinking: true, claims });
    const { linkToken } = (await login()).body as { linkToken: string };
    auth.confirmGoogleLink.mockRejectedValue(new GoogleAccountAlreadyLinkedException());

    const response = await confirm({ linkToken });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('GOOGLE_ACCOUNT_ALREADY_LINKED');
    expect(response.headers['set-cookie']).toBeUndefined();
  });
});
