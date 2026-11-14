import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import type { SessionService } from '../../../common/services/session.service.js';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import { RefreshTokenService } from '../services/refresh-token.service.js';
import { SessionRevokedException } from '../exceptions/index.js';

const FRONTEND_ORIGIN = 'https://front.example.test';
const userId = '11111111-1111-4111-8111-111111111111';
const jwt = new JwtService({
  secret: 'auth-cookie-test-secret',
  signOptions: { expiresIn: '1h' },
});
const token = jwt.sign({
  sub: userId,
  roleTag: 'titulado',
  roles: ['titulado'],
});

describe('session cookie over HTTP', () => {
  let app: INestApplication;
  const authService = {
    login: vi.fn(),
    getSession: vi.fn(),
    getAccessTokenMaxAgeMs: vi.fn(),
  };
  const refreshTokens = {
    startFromLogin: vi.fn(),
    rotate: vi.fn(),
    revokeByToken: vi.fn(),
  };
  const session = { getAuthenticatedUser: vi.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: RefreshTokenService, useValue: refreshTokens },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new JwtAuthGuard(jwt, session as unknown as SessionService))
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  beforeEach(() => {
    vi.stubEnv('CORS_ORIGIN', FRONTEND_ORIGIN);
    authService.login.mockResolvedValue({
      accessToken: token,
      roleTag: 'titulado',
      roles: ['titulado'],
    });
    authService.getAccessTokenMaxAgeMs.mockReturnValue(3_600_000);
    refreshTokens.startFromLogin.mockResolvedValue({
      refreshToken: 'refresh-1',
      refreshMaxAgeMs: 900_000,
    });
    refreshTokens.rotate.mockResolvedValue({
      accessToken: token,
      accessMaxAgeMs: 900_000,
      refreshToken: 'refresh-2',
      refreshMaxAgeMs: 900_000,
      roleTag: 'titulado',
      roles: ['titulado'],
    });
    refreshTokens.revokeByToken.mockResolvedValue(undefined);
    authService.getSession.mockReturnValue({ id: userId });
    session.getAuthenticatedUser.mockResolvedValue({
      id: userId,
      email: 'user@example.test',
      roles: ['titulado'],
      company: null,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('login still returns the token and also sets an HttpOnly cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({});

    expect(response.body.accessToken).toBe(token);
    const cookie = String(response.headers['set-cookie']?.[0]);
    expect(cookie).toContain(`umssy_access=${token}`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=3600');
  });

  it('login also sets the refresh cookie scoped to the auth endpoints', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({});

    const cookies = (response.headers['set-cookie'] as unknown as string[]) ?? [];
    const refresh = cookies.find((item) => item.startsWith('umssy_refresh='));
    expect(refresh).toContain('umssy_refresh=refresh-1');
    expect(refresh).toContain('HttpOnly');
    expect(refresh).toContain('SameSite=Lax');
    expect(refresh).toContain('Path=/api/auth');
    expect(refresh).toContain('Max-Age=900');
    expect(response.body).not.toHaveProperty('refreshToken');
  });

  it('refresh rotates both cookies using only the refresh cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('User-Agent', 'test-agent')
      .set('Cookie', 'umssy_refresh=refresh-1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ roleTag: 'titulado', roles: ['titulado'] });
    expect(refreshTokens.rotate).toHaveBeenCalledWith(
      'refresh-1',
      'test-agent',
    );
    const cookies = (response.headers['set-cookie'] as unknown as string[]) ?? [];
    expect(cookies.some((item) => item.startsWith(`umssy_access=${token}`))).toBe(
      true,
    );
    expect(cookies.some((item) => item.startsWith('umssy_refresh=refresh-2'))).toBe(
      true,
    );
  });

  it('refresh failure answers 401 with the code and clears both cookies', async () => {
    refreshTokens.rotate.mockRejectedValue(new SessionRevokedException());

    const response = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', 'umssy_refresh=used-token');

    expect(response.status).toBe(401);
    expect(JSON.stringify(response.body)).toContain('SESSION_REVOKED');
    const cookies = (response.headers['set-cookie'] as unknown as string[]) ?? [];
    expect(cookies.some((item) => item.startsWith('umssy_access=;'))).toBe(true);
    expect(cookies.some((item) => item.startsWith('umssy_refresh=;'))).toBe(true);
  });

  it('accepts the cookie alone to read the session', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/session')
      .set('Cookie', `umssy_access=${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: userId });
  });

  it('still accepts the Authorization header alone', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/session')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it('rejects a request with neither header nor cookie', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/auth/session',
    );

    expect(response.status).toBe(401);
  });

  it('rejects a tampered cookie', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/session')
      .set('Cookie', `umssy_access=${token}x`);

    expect(response.status).toBe(401);
  });

  it('logout clears the cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', `umssy_access=${token}`);

    expect(response.status).toBe(204);
    const cookie = String(response.headers['set-cookie']?.[0]);
    expect(cookie).toContain('umssy_access=;');
    expect(cookie).toContain('Expires=Thu, 01 Jan 1970');
  });

  it('logout revokes the refresh family and clears the refresh cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', `umssy_access=${token}; umssy_refresh=refresh-1`);

    expect(response.status).toBe(204);
    expect(refreshTokens.revokeByToken).toHaveBeenCalledWith('refresh-1');
    const cookies = (response.headers['set-cookie'] as unknown as string[]) ?? [];
    expect(cookies.some((item) => item.startsWith('umssy_refresh=;'))).toBe(true);
  });
});
