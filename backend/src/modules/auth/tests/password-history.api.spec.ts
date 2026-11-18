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
import { PasswordReusedException } from '../exceptions/password-reused.exception.js';
import { PasswordResetConflictException } from '../exceptions/password-reset-conflict.exception.js';

describe('Contrato HTTP de errores del historial', () => {
  let app: INestApplication;
  const auth = { resetPassword: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      imports: [CredentialSecurityModule],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: RefreshTokenService, useValue: {} },
        { provide: GoogleAuthService, useValue: {} },
      ],
    }).overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterEach(async () => { await app?.close(); });

  it.each([new PasswordReusedException(), new PasswordResetConflictException()])(
    'devuelve el estado, código y detalle de %s',
    async (failure) => {
      auth.resetPassword.mockRejectedValueOnce(failure);
      const response = await request(app.getHttpServer())
        .post('/api/auth/forgot-password/reset')
        .send({ email: 'user@example.test', code: '123456', password: 'NuevaPassword1' })
        .expect(failure.statusCode);
      expect(response.body).toEqual({
        statusCode: failure.statusCode, code: failure.code,
        detail: failure.message, data: null, ok: false,
      });
      expect(response.headers['set-cookie']).toBeUndefined();
      expect(auth.resetPassword).toHaveBeenCalledTimes(1);
    },
  );
});
