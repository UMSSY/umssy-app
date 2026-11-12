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
import { MentorsRepository } from '../repositories/mentors.repository.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { UserSkillService } from '../../skills/services/user-skill.service.js';
import {
  buildEmptyMentorProfile,
  buildMentorProfile,
} from './fixtures/mentor-profile.fixture.js';
import { createMentorProfileEditingFixture } from './fixtures/mentor-profile-editing.fixture.js';

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
      expect(response.body).toEqual({
        statusCode: 401,
        ok: false,
        code: 'UNAUTHENTICATED',
        detail: 'Se requiere una sesión válida.',
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
    expect(response.body).toEqual({
      statusCode: 403,
      ok: false,
      code: 'USER_INACTIVE',
      detail: 'La cuenta del usuario está inactiva.',
      data: null,
    });
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

  it.each([
    {
      state: 'active mentor with availability disabled',
      roles: [{ deletedAt: null, startAt: new Date(0) }],
      pendingCount: 4,
    },
    {
      state: 'deactivated participation with a soft-deleted mentor role',
      roles: [{ deletedAt: new Date(0), startAt: new Date(0) }],
      pendingCount: 0,
    },
    { state: 'removed mentor role', roles: [], pendingCount: 0 },
    {
      state: 'future-starting mentor role',
      roles: [{ deletedAt: null, startAt: new Date('2099-01-01') }],
      pendingCount: 0,
    },
  ])(
    'preserves the repository participation filters over HTTP for $state',
    async ({ roles, pendingCount }) => {
      const profile = {
        ...buildEmptyMentorProfile(),
        id: 'mentor-a',
        isAvailableForMentoring: false,
      };
      const findFirst = vi.fn().mockImplementation(async ({ where }) => {
        expect(where).toEqual({
          id: 'mentor-a',
          isActive: true,
          roles: {
            some: {
              deletedAt: null,
              startAt: { lte: expect.any(Date) },
              role: { name: 'mentor' },
            },
          },
        });
        return roles.some(
          (role) =>
            role.deletedAt === null &&
            role.startAt <= where.roles.some.startAt.lte,
        )
          ? profile
          : null;
      });
      const repository = new MentorsRepository({
        user: { findFirst },
      } as unknown as PrismaService);
      findActiveMentorById.mockImplementation((id, now) =>
        repository.findActiveMentorById(id, now),
      );
      findUserById.mockResolvedValueOnce({
        id: 'mentor-a',
        email: 'mentor@test.com',
        isActive: true,
        company: null,
        roles: [{ role: { name: pendingCount > 0 ? 'mentor' : 'titulado' } }],
      });
      const response = await request(app.getHttpServer())
        .get(path)
        .auth(token(), { type: 'bearer' })
        .expect(200);
      expect(response.body.data.pendingCount).toBe(pendingCount);
      expect(response.body.data.suggestions).toHaveLength(pendingCount);
      expect(findFirst).toHaveBeenCalledTimes(1);
      if (pendingCount === 0)
        expect(response.body.data).toEqual({
          suggestions: [],
          pendingCount: 0,
        });
    },
  );

  it.each([
    { technicalAreas: false, orientations: true },
    { technicalAreas: true, orientations: false },
    { technicalAreas: false, orientations: false },
    { technicalAreas: true, orientations: true },
  ])(
    'keeps technical areas independent from orientations over HTTP (areas=$technicalAreas, orientations=$orientations)',
    async ({ technicalAreas, orientations }) => {
      const complete = buildMentorProfile();
      findActiveMentorById.mockResolvedValueOnce(
        buildMentorProfile({
          id: 'mentor-a',
          mentorTechnicalAreas: technicalAreas
            ? complete.mentorTechnicalAreas
            : [],
          mentorOrientationTypes: orientations
            ? [
                {
                  orientationType: {
                    id: 'orientation-1',
                    name: 'Orientación técnica',
                    description: null,
                  },
                },
              ]
            : [],
        }),
      );
      const response = await request(app.getHttpServer())
        .get(path)
        .auth(token(), { type: 'bearer' })
        .expect(200);
      expect(
        response.body.data.suggestions.map(
          (item: { code: string }) => item.code,
        ),
      ).toEqual(technicalAreas ? [] : ['MISSING_SPECIALTY']);
      expect(response.body.data.pendingCount).toBe(technicalAreas ? 0 : 1);
      expect(response.body.data.pendingCount).toBe(
        response.body.data.suggestions.length,
      );
      if (technicalAreas)
        expect(response.body).toEqual({
          statusCode: 200,
          ok: true,
          detail: 'OK',
          data: { suggestions: [], pendingCount: 0 },
        });
    },
  );

  it('isolates distinct active mentor profiles despite arbitrary query and body identities', async () => {
    const profiles = new Map([
      ['mentor-a', buildMentorProfile({ id: 'mentor-a', aboutMe: null })],
      [
        'mentor-b',
        buildMentorProfile({
          id: 'mentor-b',
          photoUrl: null,
          workExperiences: [],
        }),
      ],
    ]);
    findActiveMentorById.mockImplementation(async (id) =>
      structuredClone(profiles.get(id) ?? null),
    );
    const first = await request(app.getHttpServer())
      .get(`${path}?userId=mentor-b&mentorId=mentor-b`)
      .auth(token(), { type: 'bearer' })
      .send({ userId: 'mentor-b', id: 'mentor-b' })
      .expect(200);
    expect(
      first.body.data.suggestions.map((item: { code: string }) => item.code),
    ).toEqual(['MISSING_PROFESSIONAL_DESCRIPTION']);
    expect(first.body.data.pendingCount).toBe(1);
    const second = await request(app.getHttpServer())
      .get(`${path}?userId=mentor-a`)
      .auth(token('mentor-b'), { type: 'bearer' })
      .expect(200);
    expect(
      second.body.data.suggestions.map((item: { code: string }) => item.code),
    ).toEqual(['MISSING_PROFILE_PHOTO', 'MISSING_WORK_EXPERIENCE']);
    expect(second.body.data.pendingCount).toBe(2);
    const again = await request(app.getHttpServer())
      .get(`${path}?mentorId=mentor-b`)
      .auth(token(), { type: 'bearer' })
      .expect(200);
    expect(again.body).toEqual(first.body);
    expect(findUserById.mock.calls).toEqual([
      ['mentor-a'],
      ['mentor-b'],
      ['mentor-a'],
    ]);
    expect(findActiveMentorById.mock.calls.map(([id]) => id)).toEqual([
      'mentor-a',
      'mentor-b',
      'mentor-a',
    ]);
    await request(app.getHttpServer())
      .get('/api/mentors/mentor-b/profile-suggestions')
      .auth(token(), { type: 'bearer' })
      .expect(404);
    expect(findActiveMentorById).toHaveBeenCalledTimes(3);
  });

  it.each(['profile', 'session'] as const)(
    'propagates %s repository failures through the shared filter without exposing their details',
    async (source) => {
      const error = new Error('private database details');
      if (source === 'profile')
        findActiveMentorById.mockRejectedValueOnce(error);
      else findUserById.mockRejectedValueOnce(error);
      const response = await request(app.getHttpServer())
        .get(path)
        .auth(token(), { type: 'bearer' })
        .expect(500);
      expect(response.body).toEqual({
        statusCode: 500,
        ok: false,
        code: 'INTERNAL_ERROR',
        detail: 'Ocurrió un error interno al procesar la solicitud.',
        data: null,
      });
      expect(JSON.stringify(response.body)).not.toContain(
        'private database details',
      );
      if (source === 'session')
        expect(findActiveMentorById).not.toHaveBeenCalled();
    },
  );

  it.each([
    { field: 'photoUrl', code: 'MISSING_PROFILE_PHOTO' },
    { field: 'aboutMe', code: 'MISSING_PROFESSIONAL_DESCRIPTION' },
    { field: 'mentorTechnicalAreas', code: 'MISSING_SPECIALTY' },
    { field: 'workExperiences', code: 'MISSING_WORK_EXPERIENCE' },
  ] as const)(
    'refreshes only $code after saving $field through its existing service with the same JWT (simulated repositories)',
    async ({ field, code }) => {
      const editing = createMentorProfileEditingFixture('mentor-a');
      findActiveMentorById.mockImplementation(editing.read);
      const authorization = token();
      const before = await request(app.getHttpServer())
        .get(path)
        .auth(authorization, { type: 'bearer' })
        .expect(200);
      expect(before.body.data.pendingCount).toBe(4);
      const storedBefore = editing.snapshot();

      await editing.save[field]();

      const after = await request(app.getHttpServer())
        .get(path)
        .auth(authorization, { type: 'bearer' })
        .expect(200);
      expect(after.body.data.suggestions).toEqual(
        before.body.data.suggestions.filter(
          (item: { code: string }) => item.code !== code,
        ),
      );
      expect(after.body.data.pendingCount).toBe(3);
      expect(after.body.data.pendingCount).toBe(
        after.body.data.suggestions.length,
      );
      expect(editing.snapshot()[field]).not.toEqual(storedBefore[field]);
      expect(
        Object.values(editing.writes).reduce(
          (count, write) => count + write.mock.calls.length,
          0,
        ),
      ).toBe(1);
      expect(findUserById.mock.calls).toEqual([['mentor-a'], ['mentor-a']]);
      expect(findActiveMentorById.mock.calls.map(([id]) => id)).toEqual([
        'mentor-a',
        'mentor-a',
      ]);
    },
  );

  it.each([
    'photoUrl',
    'aboutMe',
    'mentorTechnicalAreas',
    'workExperiences',
  ] as const)(
    'preserves suggestions after discarding a %s draft without saving (simulated repositories)',
    async (field) => {
      const editing = createMentorProfileEditingFixture('mentor-a');
      findActiveMentorById.mockImplementation(editing.read);
      const authorization = token();
      const before = await request(app.getHttpServer())
        .get(path)
        .auth(authorization, { type: 'bearer' })
        .expect(200);
      const storedBefore = editing.snapshot();

      {
        const draft = editing.snapshot();
        Object.assign(draft, {
          [field]: structuredClone(buildMentorProfile()[field]),
        });
        expect(draft[field]).not.toEqual(storedBefore[field]);
      }

      const after = await request(app.getHttpServer())
        .get(path)
        .auth(authorization, { type: 'bearer' })
        .expect(200);
      expect(after.body).toEqual(before.body);
      expect(after.body.data.pendingCount).toBe(4);
      expect(after.body.data.pendingCount).toBe(
        after.body.data.suggestions.length,
      );
      expect(editing.snapshot()).toEqual(storedBefore);
      for (const write of Object.values(editing.writes))
        expect(write).not.toHaveBeenCalled();
      expect(findActiveMentorById.mock.calls.map(([id]) => id)).toEqual([
        'mentor-a',
        'mentor-a',
      ]);
    },
  );
});
