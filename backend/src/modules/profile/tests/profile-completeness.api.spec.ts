import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { SessionService } from '../../../common/services/session.service.js';
import { ProfileCompletenessController } from '../controllers/profile-completeness.controller.js';
import { ProfileNotFoundException } from '../exceptions/profile-not-found.exception.js';
import { ProfileCompletenessService } from '../services/profile-completeness.service.js';

const userId = '11111111-1111-4111-8111-111111111111';
const jwt = new JwtService({ secret: 'profile-completeness-test-secret' });
const token = jwt.sign({
  sub: userId,
  roleTag: 'titulado',
  roles: ['titulado'],
});
const result = {
  percentage: 0,
  sections: [
    { id: 'contact', weight: 15, isCompleted: false },
    { id: 'presentation', weight: 15, isCompleted: false },
    { id: 'education', weight: 15, isCompleted: false },
    { id: 'work-experience', weight: 15, isCompleted: false },
    { id: 'skills', weight: 15, isCompleted: false },
    { id: 'certifications', weight: 10, isCompleted: false },
    { id: 'cv', weight: 15, isCompleted: false },
  ],
};

describe('GET /api/profile/completeness', () => {
  let app: INestApplication;
  const completeness = { getCompleteness: vi.fn() };
  const session = { getAuthenticatedUser: vi.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProfileCompletenessController],
      providers: [
        { provide: ProfileCompletenessService, useValue: completeness },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new JwtAuthGuard(jwt, session as unknown as SessionService))
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.listen(0, '127.0.0.1');
  });

  beforeEach(() => {
    vi.resetAllMocks();
    completeness.getCompleteness.mockResolvedValue(result);
    session.getAuthenticatedUser.mockResolvedValue({
      id: userId,
      email: 'user@example.test',
      roles: ['titulado'],
      company: null,
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns the standard envelope and prevents caching private results', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/profile/completeness')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(response.body).toEqual({
      statusCode: 200,
      ok: true,
      detail: 'OK',
      data: result,
    });
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(session.getAuthenticatedUser).toHaveBeenCalledWith(userId);
    expect(completeness.getCompleteness).toHaveBeenCalledExactlyOnceWith(
      userId,
    );
  });

  it('ignores attempts to query another user through request parameters', async () => {
    await request(app.getHttpServer())
      .get('/api/profile/completeness?userId=another-user')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(completeness.getCompleteness).toHaveBeenCalledExactlyOnceWith(
      userId,
    );
  });

  it.each([
    undefined,
    'invalid-token',
    jwt.sign({ sub: userId, roleTag: 'titulado' }, { expiresIn: -1 }),
  ])(
    'rejects missing, invalid or expired credentials: %s',
    async (credential) => {
      const call = request(app.getHttpServer()).get(
        '/api/profile/completeness',
      );
      if (credential) call.auth(credential, { type: 'bearer' });
      await call.expect(401);
      expect(session.getAuthenticatedUser).not.toHaveBeenCalled();
      expect(completeness.getCompleteness).not.toHaveBeenCalled();
    },
  );

  it('returns the domain error when the profile no longer exists', async () => {
    completeness.getCompleteness.mockRejectedValue(
      new ProfileNotFoundException(),
    );
    const response = await request(app.getHttpServer())
      .get('/api/profile/completeness')
      .auth(token, { type: 'bearer' })
      .expect(404);
    expect(response.body).toMatchObject({
      ok: false,
      code: 'PROFILE_NOT_FOUND',
      data: null,
    });
  });

  it('documents the secured endpoint and the response schema', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );
    const endpoint = document.paths['/api/profile/completeness']?.get;
    expect(endpoint?.security).toContainEqual({ bearer: [] });
    expect(endpoint?.responses).toHaveProperty('200');
    expect(endpoint?.responses).toHaveProperty('401');
    expect(endpoint?.responses).toHaveProperty('404');
    expect(JSON.stringify(endpoint?.responses['200'])).toContain('isCompleted');
  });
});
