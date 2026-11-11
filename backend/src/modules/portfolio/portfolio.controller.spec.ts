import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
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
import { DomainExceptionFilter } from '../../common/filters/domain-exception.filter.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { SessionService } from '../../common/services/session.service.js';
import {
  DuplicatePortfolioProjectException,
  MaxPortfolioProjectsExceededException,
} from './exceptions/portfolio.exceptions.js';
import { PortfolioController } from './portfolio.controller.js';
import { PortfolioService } from './portfolio.service.js';
import type { PortfolioProjectDto } from './types/portfolio.types.js';

const userId = '11111111-1111-4111-8111-111111111111';
const jwt = new JwtService({ secret: 'portfolio-controller-test-secret' });
const token = jwt.sign({
  sub: userId,
  roleTag: 'titulado',
  roles: ['titulado'],
});

const sampleDto: PortfolioProjectDto = {
  id: '22222222-2222-4222-8222-222222222222',
  provider: 'github',
  repoName: 'umssy/umssy-app',
  repoUrl: 'https://github.com/umssy/umssy-app',
  description: 'Repositorio principal',
  language: 'TypeScript',
  starsCount: 25,
  isOwner: true,
  displayOrder: 0,
};

describe('PortfolioController', () => {
  let controller: PortfolioController;
  let app: INestApplication;
  const service = {
    getProjects: vi.fn(),
    updateProjects: vi.fn(),
  };
  const session = {
    getAuthenticatedUser: vi.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [{ provide: PortfolioService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new JwtAuthGuard(jwt, session as unknown as SessionService))
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.listen(0, '127.0.0.1');
    controller = moduleRef.get(PortfolioController);
  });

  beforeEach(() => {
    vi.resetAllMocks();
    service.getProjects.mockResolvedValue([sampleDto]);
    service.updateProjects.mockResolvedValue([sampleDto]);
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

  it('delegates getProjects directly to PortfolioService', async () => {
    await expect(controller.getProjects(userId)).resolves.toEqual([sampleDto]);
    expect(service.getProjects).toHaveBeenCalledWith(userId);
  });

  it('delegates updateProjects directly to PortfolioService', async () => {
    const payload = [
      {
        provider: 'github' as const,
        repoName: 'umssy/umssy-app',
        repoUrl: 'https://github.com/umssy/umssy-app',
        description: 'Repositorio principal',
        language: 'TypeScript',
        starsCount: 25,
        isOwner: true,
      },
    ];

    await expect(
      controller.updateProjects(userId, { projects: payload }),
    ).resolves.toEqual([sampleDto]);
    expect(service.updateProjects).toHaveBeenCalledWith(userId, payload);
  });

  it('GET /api/profile/portfolio/projects returns standardized JSON envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/profile/portfolio/projects')
      .auth(token, { type: 'bearer' })
      .expect(200);

    expect(response.body).toEqual({
      statusCode: 200,
      ok: true,
      detail: 'OK',
      data: [sampleDto],
    });
    expect(service.getProjects).toHaveBeenCalledExactlyOnceWith(userId);
  });

  it('PUT /api/profile/portfolio/projects validates body and returns standardized JSON envelope', async () => {
    const response = await request(app.getHttpServer())
      .put('/api/profile/portfolio/projects')
      .auth(token, { type: 'bearer' })
      .send({
        projects: [
          {
            provider: 'github',
            repoName: 'umssy/umssy-app',
            repoUrl: 'https://github.com/umssy/umssy-app',
            description: 'Repositorio principal',
            language: 'TypeScript',
            starsCount: 25,
            isOwner: true,
          },
        ],
      })
      .expect(200);

    expect(response.body).toEqual({
      statusCode: 200,
      ok: true,
      detail: 'OK',
      data: [sampleDto],
    });
    expect(service.updateProjects).toHaveBeenCalledTimes(1);
  });

  it('rejects unauthenticated requests with 401', async () => {
    await request(app.getHttpServer())
      .get('/api/profile/portfolio/projects')
      .expect(401);

    await request(app.getHttpServer())
      .put('/api/profile/portfolio/projects')
      .send({ projects: [] })
      .expect(401);
  });

  it('rejects invalid payloads via Zod validation pipe with 400', async () => {
    const response = await request(app.getHttpServer())
      .put('/api/profile/portfolio/projects')
      .auth(token, { type: 'bearer' })
      .send({
        projects: [
          {
            provider: 'bitbucket',
            repoName: '',
            repoUrl: 'not-a-url',
            starsCount: -1,
            isOwner: true,
          },
        ],
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      ok: false,
      code: 'VALIDATION_ERROR',
    });
    expect(service.updateProjects).not.toHaveBeenCalled();
  });

  it('returns domain error response when service throws MaxPortfolioProjectsExceededException', async () => {
    service.updateProjects.mockRejectedValue(
      new MaxPortfolioProjectsExceededException(),
    );

    const response = await request(app.getHttpServer())
      .put('/api/profile/portfolio/projects')
      .auth(token, { type: 'bearer' })
      .send({ projects: [] })
      .expect(400);

    expect(response.body).toEqual({
      statusCode: 400,
      ok: false,
      code: 'MAX_PORTFOLIO_PROJECTS_EXCEEDED',
      detail: 'A maximum of 6 featured portfolio projects is allowed',
      data: null,
    });
  });

  it('returns domain error response when service throws DuplicatePortfolioProjectException', async () => {
    service.updateProjects.mockRejectedValue(
      new DuplicatePortfolioProjectException(),
    );

    const response = await request(app.getHttpServer())
      .put('/api/profile/portfolio/projects')
      .auth(token, { type: 'bearer' })
      .send({ projects: [] })
      .expect(400);

    expect(response.body).toEqual({
      statusCode: 400,
      ok: false,
      code: 'DUPLICATE_PORTFOLIO_PROJECT',
      detail: 'Duplicate repository for the same provider is not allowed',
      data: null,
    });
  });

  it('documents GET and PUT endpoints in Swagger with bearer auth', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );
    const pathItem = document.paths['/api/profile/portfolio/projects'];
    expect(pathItem?.get?.security).toContainEqual({ bearer: [] });
    expect(pathItem?.put?.security).toContainEqual({ bearer: [] });
    expect(pathItem?.get?.responses).toHaveProperty('200');
    expect(pathItem?.put?.responses).toHaveProperty('400');
  });
});

