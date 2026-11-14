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
  const session = { getAuthenticatedUser: vi.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
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
});
