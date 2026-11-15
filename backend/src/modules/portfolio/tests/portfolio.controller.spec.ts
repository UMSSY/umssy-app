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
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import type { SessionService } from '../../../common/services/session.service.js';
import { PortfolioController } from '../controllers/portfolio.controller.js';
import { DuplicatePortfolioProjectException } from '../exceptions/duplicate-portfolio-project.exception.js';
import { MaxPortfolioProjectsExceededException } from '../exceptions/max-portfolio-projects-exceeded.exception.js';
import type { ExternalRepositoryResponse } from '../responses/external-repository.response.js';
import type { OAuthUrlResponse } from '../responses/oauth-url.response.js';
import type { PortfolioProjectResponse } from '../responses/portfolio-project.response.js';
import type { SocialAccountStatusResponse } from '../responses/social-account-status.response.js';
import type { SocialAccountResponse } from '../responses/social-account.response.js';
import { PortfolioService } from '../services/portfolio.service.js';
import { SocialOAuthService } from '../services/social-oauth.service.js';

const userId = '11111111-1111-4111-8111-111111111111';
const jwt = new JwtService({ secret: 'portfolio-controller-test-secret' });
const token = jwt.sign({
  sub: userId,
  roleTag: 'titulado',
  roles: ['titulado'],
});

const sampleDto: PortfolioProjectResponse = {
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

const sampleAccounts: SocialAccountStatusResponse[] = [
  {
    provider: 'github',
    connected: true,
    username: 'octocat',
    profileUrl: 'https://github.com/octocat',
  },
  {
    provider: 'gitlab',
    connected: false,
    username: null,
    profileUrl: null,
  },
];

const sampleRepo: ExternalRepositoryResponse = {
  provider: 'github',
  repoName: 'umssy-app',
  repoUrl: 'https://github.com/octocat/umssy-app',
  description: 'Sistema principal',
  language: 'TypeScript',
  starsCount: 15,
  isOwner: true,
  updatedAt: '2026-11-10T12:00:00.000Z',
};

const sampleConnectedAccount: SocialAccountResponse = {
  id: '33333333-3333-4333-8333-333333333333',
  provider: 'github',
  username: 'octocat',
  profileUrl: 'https://github.com/octocat',
  connected: true,
};

const sampleOAuthUrl: OAuthUrlResponse = {
  url: 'https://github.com/login/oauth/authorize?client_id=client123',
};

describe('PortfolioController', () => {
  let controller: PortfolioController;
  let app: INestApplication;

  const service = {
    getProjects: vi.fn(),
    updateProjects: vi.fn(),
    getAccounts: vi.fn(),
    getRepositories: vi.fn(),
  };

  const socialOAuthService = {
    getAuthorizationUrl: vi.fn(),
    connectWithCode: vi.fn(),
  };

  const session = {
    getAuthenticatedUser: vi.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        { provide: PortfolioService, useValue: service },
        { provide: SocialOAuthService, useValue: socialOAuthService },
      ],
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
    service.getAccounts.mockResolvedValue(sampleAccounts);
    service.getRepositories.mockResolvedValue([sampleRepo]);
    socialOAuthService.getAuthorizationUrl.mockReturnValue(sampleOAuthUrl);
    socialOAuthService.connectWithCode.mockResolvedValue(sampleConnectedAccount);
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
    expect(service.getProjects).toHaveBeenCalledWith(userId);
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

  it('GET /api/profile/portfolio/accounts returns connected social accounts', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/profile/portfolio/accounts')
      .auth(token, { type: 'bearer' })
      .expect(200);

    expect(response.body).toEqual({
      statusCode: 200,
      ok: true,
      detail: 'OK',
      data: sampleAccounts,
    });
    expect(service.getAccounts).toHaveBeenCalledWith(userId);
  });

  it('GET /api/profile/portfolio/oauth/:provider/url returns authorization URL', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/profile/portfolio/oauth/github/url?state=mystate')
      .auth(token, { type: 'bearer' })
      .expect(200);

    expect(response.body).toEqual({
      statusCode: 200,
      ok: true,
      detail: 'OK',
      data: sampleOAuthUrl,
    });
    expect(socialOAuthService.getAuthorizationUrl).toHaveBeenCalledWith(
      'github',
      'mystate',
    );
  });

  it('POST /api/profile/portfolio/oauth/:provider/callback connects account and returns account dto without tokens', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/profile/portfolio/oauth/github/callback')
      .auth(token, { type: 'bearer' })
      .send({ code: 'valid-auth-code' })
      .expect(200);

    expect(response.body).toEqual({
      statusCode: 200,
      ok: true,
      detail: 'OK',
      data: sampleConnectedAccount,
    });
    expect(socialOAuthService.connectWithCode).toHaveBeenCalledWith(
      userId,
      'github',
      'valid-auth-code',
    );
  });

  it('GET /api/profile/portfolio/repositories returns list of repositories filtered by query', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/profile/portfolio/repositories?provider=github&search=umssy')
      .auth(token, { type: 'bearer' })
      .expect(200);

    expect(response.body).toEqual({
      statusCode: 200,
      ok: true,
      detail: 'OK',
      data: [sampleRepo],
    });
    expect(service.getRepositories).toHaveBeenCalledWith(userId, {
      provider: 'github',
      search: 'umssy',
    });
  });

  it('rejects unauthenticated requests with 401', async () => {
    await request(app.getHttpServer())
      .get('/api/profile/portfolio/projects')
      .expect(401);

    await request(app.getHttpServer())
      .put('/api/profile/portfolio/projects')
      .send({ projects: [] })
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/profile/portfolio/accounts')
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/profile/portfolio/oauth/github/url')
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/profile/portfolio/oauth/github/callback')
      .send({ code: 'code' })
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/profile/portfolio/repositories')
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

  it('documents GET, PUT, and POST endpoints in Swagger with bearer auth', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );
    const projectsPath = document.paths['/api/profile/portfolio/projects'];
    expect(projectsPath?.get?.security).toContainEqual({ bearer: [] });
    expect(projectsPath?.put?.security).toContainEqual({ bearer: [] });
    expect(projectsPath?.get?.responses).toHaveProperty('200');
    expect(projectsPath?.put?.responses).toHaveProperty('400');

    const accountsPath = document.paths['/api/profile/portfolio/accounts'];
    expect(accountsPath?.get?.security).toContainEqual({ bearer: [] });

    const oauthUrlPath =
      document.paths['/api/profile/portfolio/oauth/{provider}/url'];
    expect(oauthUrlPath?.get?.security).toContainEqual({ bearer: [] });

    const oauthCallbackPath =
      document.paths['/api/profile/portfolio/oauth/{provider}/callback'];
    expect(oauthCallbackPath?.post?.security).toContainEqual({ bearer: [] });

    const reposPath = document.paths['/api/profile/portfolio/repositories'];
    expect(reposPath?.get?.security).toContainEqual({ bearer: [] });
  });
});
