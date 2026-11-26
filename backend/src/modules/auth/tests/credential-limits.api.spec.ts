import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodValidationPipe } from 'nestjs-zod';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CredentialSecurityModule } from '../credential-security.module.js';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import { RefreshTokenService } from '../services/refresh-token.service.js';
import { GoogleAuthService } from '../services/google-auth.service.js';
import { GoogleLinkTokenService } from '../services/google-link-token.service.js';
import { InvalidCredentialsException } from '../exceptions/invalid-credentials.exception.js';
import { InvalidResetCodeException } from '../exceptions/invalid-reset-code.exception.js';

describe('Límites por HTTP con servicios de negocio simulados', () => {
  let app: INestApplication;
  const email = 'user@example.test';
  const ok = { ok: true, message: 'Respuesta genérica' };
  const auth = {
    login: vi.fn(),
    getAccessTokenMaxAgeMs: vi.fn(),
    requestPasswordReset: vi.fn(),
    verifyPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
  };
  const refresh = { startFromLogin: vi.fn() };

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
    vi.resetAllMocks();
    auth.login.mockRejectedValue(new InvalidCredentialsException());
    auth.getAccessTokenMaxAgeMs.mockReturnValue(3_600_000);
    auth.requestPasswordReset.mockResolvedValue(ok);
    auth.verifyPasswordReset.mockResolvedValue(ok);
    auth.resetPassword.mockResolvedValue(ok);
    refresh.startFromLogin.mockResolvedValue({
      refreshToken: 'refresh-test',
      refreshMaxAgeMs: 900_000,
    });

    const moduleRef = await Test.createTestingModule({
      imports: [CredentialSecurityModule],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: RefreshTokenService, useValue: refresh },
        { provide: GoogleAuthService, useValue: { verifyCredential: vi.fn() } },
        { provide: GoogleLinkTokenService, useValue: { sign: vi.fn(), verify: vi.fn() } },
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
    vi.useRealTimers();
  });

  it.each(['known@example.test', 'missing@example.test'])(
    'devuelve el mismo bloqueo de login y Retry-After para %s',
    async (account) => {
      for (let index = 0; index < 4; index++) {
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: account, password: 'PasswordSafe1' })
          .expect(401);
      }
      const blocked = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: account, password: 'PasswordSafe1' })
        .expect(429);
      expect(blocked.body.detail).toBe(
        'Alcanzaste el límite de intentos para iniciar sesión. Inténtalo más tarde.',
      );
      expect(blocked.headers['retry-after']).toBe('900');
      expect(blocked.body.data).toMatchObject({
        operation: 'login',
        retryAfterSeconds: 900,
      });
      expect(auth.login).toHaveBeenCalledTimes(5);

      auth.login.mockResolvedValue({
        accessToken: 'access-test',
        roleTag: 'titulado',
        roles: ['titulado'],
      });
      const stillBlocked = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: account, password: 'PasswordSafe1' })
        .expect(429);
      expect(stillBlocked.headers['set-cookie']).toBeUndefined();
      expect(auth.login).toHaveBeenCalledTimes(5);

      vi.setSystemTime(Date.now() + 900_000);
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: account, password: 'PasswordSafe1' })
        .expect(201);
    },
  );

  it('limita los envíos e informa la espera de la ventana móvil', async () => {
    const started = Date.now();
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password/request')
      .send({ email })
      .expect(201);
    const cooldown = await request(app.getHttpServer())
      .post('/api/auth/forgot-password/request')
      .send({ email })
      .expect(429);
    expect(cooldown.body.code).toBe('PASSWORD_RESET_COOLDOWN');
    expect(cooldown.headers['retry-after']).toBe('120');

    for (let index = 1; index < 3; index++) {
      vi.setSystemTime(started + index * 120_000);
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password/request')
        .send({ email })
        .expect(201);
    }
    vi.setSystemTime(started + 360_000);
    const blocked = await request(app.getHttpServer())
      .post('/api/auth/forgot-password/request')
      .send({ email })
      .expect(429);
    expect(blocked.body.detail).toBe(
      'Has solicitado demasiados códigos en poco tiempo. Inténtalo más tarde.',
    );
    expect(blocked.headers['retry-after']).toBe('540');
    expect(auth.requestPasswordReset).toHaveBeenCalledTimes(3);
    vi.setSystemTime(started + 900_000);
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password/request')
      .send({ email })
      .expect(201);
  });

  it('reenviar no permite verificar ni confirmar durante el bloqueo', async () => {
    auth.verifyPasswordReset.mockRejectedValue(new InvalidResetCodeException());
    for (let index = 0; index < 4; index++) {
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password/verify')
        .send({ email, code: '111111' })
        .expect(400);
    }
    const blocked = await request(app.getHttpServer())
      .post('/api/auth/forgot-password/verify')
      .send({ email, code: '111111' })
      .expect(429);
    expect(blocked.body.detail).toBe(
      'Alcanzaste el límite de intentos para verificar el código. Inténtalo más tarde.',
    );
    expect(blocked.headers['retry-after']).toBe('900');

    await request(app.getHttpServer())
      .post('/api/auth/forgot-password/request')
      .send({ email })
      .expect(201);
    auth.verifyPasswordReset.mockResolvedValue(ok);
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password/verify')
      .send({ email, code: '654321' })
      .expect(429);
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password/reset')
      .send({ email, code: '654321', password: 'PasswordSafe1' })
      .expect(429);
    expect(auth.verifyPasswordReset).toHaveBeenCalledTimes(5);
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });

  it('la restricción de login permite solicitar recuperación', async () => {
    for (let index = 0; index < 5; index++) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'PasswordSafe1' });
    }
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password/request')
      .send({ email })
      .expect(201);
    expect(auth.requestPasswordReset).toHaveBeenCalledTimes(1);
  });

  it('verificar códigos correctos no consume el límite de fallos', async () => {
    for (let index = 0; index < 8; index++) {
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password/verify')
        .send({ email, code: '123456' })
        .expect(201);
    }
    auth.verifyPasswordReset.mockRejectedValue(new InvalidResetCodeException());
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password/verify')
      .send({ email, code: '111111' })
      .expect(400);
  });

  it.each(['login', 'verify', 'request', 'reset'] as const)(
    'las solicitudes HTTP simultáneas respetan los límites: %s',
    async (operation) => {
      if (operation === 'verify') {
        auth.verifyPasswordReset.mockRejectedValue(
          new InvalidResetCodeException(),
        );
      }
      const path =
        operation === 'login'
          ? '/api/auth/login'
          : '/api/auth/forgot-password/' + operation;
      const responses = await Promise.all(
        Array.from({ length: 12 }, () =>
          request(app.getHttpServer())
            .post(path)
            .send({ email, code: '123456', password: 'PasswordSafe1' }),
        ),
      );
      const action =
        operation === 'login'
          ? auth.login
          : operation === 'verify'
            ? auth.verifyPasswordReset
            : operation === 'request'
              ? auth.requestPasswordReset
              : auth.resetPassword;
      expect(action).toHaveBeenCalledTimes(operation === 'request' ? 1 : 5);
      const accepted = responses.filter((response) => response.status !== 429);
      expect(accepted).toHaveLength(
        operation === 'request' ? 1 : operation === 'reset' ? 5 : 4,
      );
    },
  );

  it('rechaza entradas inválidas sin consumir la cuota de un correo válido', async () => {
    for (let index = 0; index < 4; index++) {
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password/request')
        .send({ email: 'correo-invalido' })
        .expect(400);
    }
    expect(auth.requestPasswordReset).not.toHaveBeenCalled();
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password/request')
      .send({ email })
      .expect(201);
    expect(auth.requestPasswordReset).toHaveBeenCalledTimes(1);
  });
});
