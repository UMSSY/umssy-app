import 'reflect-metadata';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { SessionService } from '../../../common/services/session.service.js';
import type { SessionRepository } from '../../../common/repositories/session.repository.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { MentorsController } from '../controllers/mentors.controller.js';
import { MentorsService } from '../services/mentors.service.js';
import { MentorProfileSuggestionsService } from '../services/mentor-profile-suggestions.service.js';
import { MentorMapper } from '../mappers/mentor.mapper.js';
import type { MentorsRepository } from '../repositories/mentors.repository.js';
import type { UserSkillService } from '../../skills/services/user-skill.service.js';
import { buildEmptyMentorProfile } from './fixtures/mentor-profile.fixture.js';

describe('GET /api/mentors/me/profile-suggestions', () => {
  const path = '/api/mentors/me/profile-suggestions';
  const jwt = new JwtService({ secret: 'hu13-http-test-secret' });
  const findUserById = vi.fn<SessionRepository['findUserById']>();
  const findActiveMentorById =
    vi.fn<MentorsRepository['findActiveMentorById']>();
  let app: INestApplication;
  const originalMetadata = Reflect.getOwnMetadata(
    'design:paramtypes',
    MentorsController,
  );

  function token(sub = 'mentor-a', expiresIn = 300) {
    return jwt.sign(
      { sub, roleTag: 'mentor', roles: ['mentor'] },
      { expiresIn },
    );
  }

  beforeAll(async () => {
    // Vitest does not emit the constructor metadata produced by the production compiler.
    Reflect.defineMetadata(
      'design:paramtypes',
      [MentorsService],
      MentorsController,
    );
    const repository = { findActiveMentorById } as unknown as MentorsRepository;
    const service = new MentorsService(
      repository,
      new MentorMapper(),
      {} as UserSkillService,
      new MentorProfileSuggestionsService(repository),
    );
    const session = new SessionService({
      findUserById,
    } as unknown as SessionRepository);
    const module = await Test.createTestingModule({
      controllers: [MentorsController],
      providers: [
        { provide: MentorsService, useValue: service },
        { provide: JwtService, useValue: jwt },
        { provide: SessionService, useValue: session },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new JwtAuthGuard(jwt, session))
      .compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    if (originalMetadata === undefined)
      Reflect.deleteMetadata('design:paramtypes', MentorsController);
    else
      Reflect.defineMetadata(
        'design:paramtypes',
        originalMetadata,
        MentorsController,
      );
  });

  beforeEach(() => {
    vi.resetAllMocks();
    findUserById.mockImplementation(async (id) => ({
      id,
      email: `${id}@test.com`,
      isActive: true,
      company: null,
      roles: [{ role: { name: 'mentor' } }],
    }));
    findActiveMentorById.mockResolvedValue(buildEmptyMentorProfile());
  });

  it('accepts a signed JWT and returns only the public suggestion contract', async () => {
    const response = await request(app.getHttpServer())
      .get(path)
      .auth(token(), { type: 'bearer' })
      .expect(200);
    expect(response.body).toMatchObject({
      statusCode: 200,
      ok: true,
      detail: 'OK',
      data: { pendingCount: 4 },
    });
    expect(response.body.data).toEqual({
      pendingCount: 4,
      suggestions: [
        {
          code: 'MISSING_PROFILE_PHOTO',
          field: 'photoUrl',
          message: 'Agrega una fotografía a tu perfil.',
          title: 'Agrega tu fotografía',
          benefitDescription:
            'Ayuda a los estudiantes a reconocerte y conocer tu perfil.',
          editReference: { section: 'photoUrl', action: 'edit' },
        },
        {
          code: 'MISSING_PROFESSIONAL_DESCRIPTION',
          field: 'aboutMe',
          message: 'Completa tu descripción profesional.',
          title: 'Completa tu descripción profesional',
          benefitDescription:
            'Presenta tu trayectoria y lo que puedes aportar como mentor.',
          editReference: { section: 'aboutMe', action: 'edit' },
        },
        {
          code: 'MISSING_SPECIALTY',
          field: 'mentorTechnicalAreas',
          message: 'Agrega al menos un área técnica como especialidad.',
          title: 'Completa tus áreas técnicas',
          benefitDescription:
            'Ayuda a los estudiantes a identificar tus especialidades.',
          editReference: { section: 'mentorTechnicalAreas', action: 'edit' },
        },
        {
          code: 'MISSING_WORK_EXPERIENCE',
          field: 'workExperiences',
          message: 'Registra tu experiencia laboral.',
          title: 'Registra tu experiencia laboral',
          benefitDescription:
            'Muestra la experiencia práctica que puedes compartir en las mentorías.',
          editReference: { section: 'workExperiences', action: 'edit' },
        },
      ],
    });
    expect(Object.keys(response.body).sort()).toEqual([
      'data',
      'detail',
      'ok',
      'statusCode',
    ]);
    expect(Object.keys(response.body.data.suggestions[0]).sort()).toEqual([
      'benefitDescription',
      'code',
      'editReference',
      'field',
      'message',
      'title',
    ]);
    expect(findUserById).toHaveBeenCalledExactlyOnceWith('mentor-a');
    expect(findActiveMentorById).toHaveBeenCalledExactlyOnceWith(
      'mentor-a',
      expect.any(Date),
    );
  });

  it.each([
    ['missing', undefined],
    ['invalid', 'invalid-token'],
    ['expired', token('mentor-a', -1)],
    [
      'wrong signature',
      new JwtService({ secret: 'other-secret' }).sign({
        sub: 'mentor-a',
        roleTag: 'mentor',
      }),
    ],
  ])(
    'rejects %s tokens before any data read',
    async (_label, authorization) => {
      const call = request(app.getHttpServer()).get(path);
      if (authorization) call.auth(authorization, { type: 'bearer' });
      const response = await call.expect(401);
      expect(response.body).toMatchObject({
        statusCode: 401,
        ok: false,
        code: 'UNAUTHENTICATED',
        data: null,
      });
      expect(findUserById).not.toHaveBeenCalled();
      expect(findActiveMentorById).not.toHaveBeenCalled();
    },
  );

  it('rejects an inactive authenticated account', async () => {
    findUserById.mockResolvedValueOnce({
      id: 'mentor-a',
      email: 'a@test.com',
      isActive: false,
      company: null,
      roles: [{ role: { name: 'mentor' } }],
    });
    const response = await request(app.getHttpServer())
      .get(path)
      .auth(token(), { type: 'bearer' })
      .expect(403);
    expect(response.body.code).toBe('USER_INACTIVE');
    expect(findActiveMentorById).not.toHaveBeenCalled();
  });

  it('returns no suggestions for an authenticated user without active mentor participation', async () => {
    findUserById.mockResolvedValueOnce({
      id: 'mentor-a',
      email: 'a@test.com',
      isActive: true,
      company: null,
      roles: [{ role: { name: 'titulado' } }],
    });
    findActiveMentorById.mockResolvedValueOnce(null);
    const response = await request(app.getHttpServer())
      .get(path)
      .auth(token(), { type: 'bearer' })
      .expect(200);
    expect(response.body.data).toEqual({ suggestions: [], pendingCount: 0 });
  });

  it('uses each validated subject and ignores arbitrary query and body identities', async () => {
    findActiveMentorById.mockImplementation(async (id) =>
      id === 'mentor-a' ? buildEmptyMentorProfile() : null,
    );
    const first = await request(app.getHttpServer())
      .get(`${path}?userId=mentor-b&mentorId=mentor-b`)
      .auth(token(), { type: 'bearer' })
      .send({ userId: 'mentor-b', id: 'mentor-b' })
      .expect(200);
    expect(first.body.data.pendingCount).toBe(4);
    const second = await request(app.getHttpServer())
      .get(`${path}?userId=mentor-a`)
      .auth(token('mentor-b'), { type: 'bearer' })
      .expect(200);
    expect(second.body.data.pendingCount).toBe(0);
    expect(findActiveMentorById.mock.calls.map(([id]) => id)).toEqual([
      'mentor-a',
      'mentor-b',
    ]);
    await request(app.getHttpServer())
      .get('/api/mentors/mentor-b/profile-suggestions')
      .auth(token(), { type: 'bearer' })
      .expect(404);
    expect(findActiveMentorById).toHaveBeenCalledTimes(2);
  });

  it('propagates repository failures through the shared filter without exposing their details', async () => {
    findActiveMentorById.mockRejectedValueOnce(
      new Error('private database details'),
    );
    const response = await request(app.getHttpServer())
      .get(path)
      .auth(token(), { type: 'bearer' })
      .expect(500);
    expect(response.body).toMatchObject({
      statusCode: 500,
      ok: false,
      data: null,
    });
    expect(JSON.stringify(response.body)).not.toContain(
      'private database details',
    );
  });
});
