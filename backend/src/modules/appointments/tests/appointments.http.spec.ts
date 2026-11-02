import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedSessionException } from '../../../common/exceptions/unauthorized-session.exception.js';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { SessionService } from '../../../common/services/session.service.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { AppointmentsModule } from '../appointments.module.js';
import {
  APPOINTMENT_ID,
  createAppointmentRecord,
  MENTOR_ID,
  OTHER_USER_ID,
  STUDENT_ID,
} from './fixtures/appointment-record.fixture.js';

describe('Appointments HTTP with shared authentication guards', () => {
  const findMany = vi.fn();
  const findUnique = vi.fn();
  const getAuthenticatedUser = vi.fn();
  const jwtService = new JwtService({
    secret: 'appointments-http-test-secret',
  });
  let app: INestApplication;
  let sessionUser: AuthenticatedUser;

  function tokenFor(userId: string, claimedRole = 'mentor'): string {
    return jwtService.sign({
      sub: userId,
      roleTag: claimedRole,
      roles: [claimedRole],
    });
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    sessionUser = {
      id: MENTOR_ID,
      email: 'mentor@test.com',
      roles: ['mentor'],
    };
    getAuthenticatedUser.mockImplementation(async () => sessionUser);
    findMany.mockResolvedValue([createAppointmentRecord()]);
    findUnique.mockResolvedValue(createAppointmentRecord());

    const moduleRef = await Test.createTestingModule({
      imports: [AppointmentsModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ appointment: { findMany, findUnique } })
      .overrideProvider(SessionService)
      .useValue({ getAuthenticatedUser })
      .overrideProvider(JwtService)
      .useValue(jwtService)
      .compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves /me before the dynamic route and returns a single global response envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/appointments/me')
      .set('Authorization', `Bearer ${tokenFor(MENTOR_ID)}`)
      .expect(200);

    expect(response.body).toEqual({
      statusCode: 200,
      ok: true,
      detail: 'Operación exitosa',
      data: [
        {
          id: APPOINTMENT_ID,
          blockId: '55555555-5555-4555-8555-555555555555',
          startAt: '2026-10-23T14:00:00.000Z',
          endAt: '2026-10-23T14:30:00.000Z',
          orientationType: {
            id: '66666666-6666-4666-8666-666666666666',
            name: 'Orientación profesional',
          },
          counterpart: { id: STUDENT_ID, fullName: 'Luis Flores' },
          status: 'CONFIRMED',
        },
      ],
    });
    expect(getAuthenticatedUser).toHaveBeenCalledExactlyOnceWith(MENTOR_ID);
    expect(findUnique).not.toHaveBeenCalled();
    expect(findMany.mock.calls[0]?.[0].where.endAt).toHaveProperty('gt');
  });

  it('validates past scope and uses the authenticated identity despite a spoofed header', async () => {
    await request(app.getHttpServer())
      .get('/appointments/me?scope=past')
      .set('Authorization', `Bearer ${tokenFor(MENTOR_ID)}`)
      .set('x-user-id', OTHER_USER_ID)
      .expect(200);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ mentorId: MENTOR_ID }, { studentId: MENTOR_ID }],
          endAt: { lte: expect.any(Date) },
        }),
      }),
    );
  });

  it.each([
    'scope=future',
    'scope=',
    'scope=upcoming&scope=past',
    'userId=another',
    'mentorId=another',
    'studentId=another',
  ])(
    'rejects invalid or identity-changing query %s before accessing appointments',
    async (query) => {
      const response = await request(app.getHttpServer())
        .get(`/appointments/me?${query}`)
        .set('Authorization', `Bearer ${tokenFor(MENTOR_ID)}`)
        .expect(400);

      expect(response.body.ok).toBe(false);
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(findMany).not.toHaveBeenCalled();
    },
  );

  it.each(['/appointments/me', `/appointments/${APPOINTMENT_ID}`])(
    'requires authentication for %s',
    async (url) => {
      await request(app.getHttpServer())
        .get(url)
        .set('x-user-id', MENTOR_ID)
        .expect(401);

      expect(getAuthenticatedUser).not.toHaveBeenCalled();
      expect(findMany).not.toHaveBeenCalled();
      expect(findUnique).not.toHaveBeenCalled();
    },
  );

  it.each([
    'invalid-token',
    new JwtService({ secret: 'wrong-secret' }).sign({
      sub: MENTOR_ID,
      roleTag: 'mentor',
    }),
  ])('rejects a token that cannot be verified', async (token) => {
    await request(app.getHttpServer())
      .get('/appointments/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    expect(getAuthenticatedUser).not.toHaveBeenCalled();
    expect(findMany).not.toHaveBeenCalled();
  });

  it('rejects an inactive session user through the shared session service', async () => {
    getAuthenticatedUser.mockRejectedValue(
      new UnauthorizedSessionException('Usuario no encontrado o inactivo'),
    );

    await request(app.getHttpServer())
      .get('/appointments/me')
      .set('Authorization', `Bearer ${tokenFor(MENTOR_ID)}`)
      .expect(401);

    expect(findMany).not.toHaveBeenCalled();
  });

  it.each(['mentor', 'titulado', 'estudiante'])(
    'allows the current database role %s',
    async (role) => {
      sessionUser = {
        id: STUDENT_ID,
        email: 'student@test.com',
        roles: [role],
      };

      const response = await request(app.getHttpServer())
        .get('/appointments/me')
        .set('Authorization', `Bearer ${tokenFor(STUDENT_ID, 'mentor')}`)
        .expect(200);

      expect(response.body.data[0].counterpart).toEqual({
        id: MENTOR_ID,
        fullName: 'Ana Pérez',
      });
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ mentorId: STUDENT_ID }, { studentId: STUDENT_ID }],
          }),
        }),
      );
    },
  );

  it.each(['/appointments/me', `/appointments/${APPOINTMENT_ID}`])(
    'rejects an unauthorized database role even if its JWT claims mentor on %s',
    async (url) => {
      sessionUser.roles = ['administrativo'];

      const response = await request(app.getHttpServer())
        .get(url)
        .set('Authorization', `Bearer ${tokenFor(MENTOR_ID, 'mentor')}`)
        .expect(403);

      expect(response.body.data).toBeNull();
      expect(findMany).not.toHaveBeenCalled();
      expect(findUnique).not.toHaveBeenCalled();
    },
  );

  it('resolves the counterpart per record for a multi-role user', async () => {
    sessionUser.roles = ['titulado', 'mentor'];
    const asMentor = createAppointmentRecord();
    const asStudent = createAppointmentRecord({
      mentorId: OTHER_USER_ID,
      studentId: MENTOR_ID,
      mentor: { id: OTHER_USER_ID, firstName: 'Marta', lastName: 'Vargas' },
      student: asMentor.mentor,
    });
    findMany.mockResolvedValue([asMentor, asStudent]);

    const response = await request(app.getHttpServer())
      .get('/appointments/me')
      .set('Authorization', `Bearer ${tokenFor(MENTOR_ID, 'titulado')}`)
      .expect(200);

    expect(
      response.body.data.map(
        (row: { counterpart: { id: string } }) => row.counterpart.id,
      ),
    ).toEqual([STUDENT_ID, OTHER_USER_ID]);
  });

  it('returns the same appointment details to mentor and student with only counterpart changed', async () => {
    const mentorResponse = await request(app.getHttpServer())
      .get(`/appointments/${APPOINTMENT_ID}`)
      .set('Authorization', `Bearer ${tokenFor(MENTOR_ID)}`)
      .expect(200);
    sessionUser = {
      id: STUDENT_ID,
      email: 'student@test.com',
      roles: ['titulado'],
    };
    const studentResponse = await request(app.getHttpServer())
      .get(`/appointments/${APPOINTMENT_ID}`)
      .set('Authorization', `Bearer ${tokenFor(STUDENT_ID, 'titulado')}`)
      .expect(200);
    const { counterpart: mentorCounterpart, ...mentorData } =
      mentorResponse.body.data;
    const { counterpart: studentCounterpart, ...studentData } =
      studentResponse.body.data;

    expect(mentorData).toEqual(studentData);
    expect(mentorCounterpart.id).toBe(STUDENT_ID);
    expect(studentCounterpart.id).toBe(MENTOR_ID);
  });

  it('returns 403 with no appointment data to a third party with an allowed role', async () => {
    sessionUser = {
      id: OTHER_USER_ID,
      email: 'third@test.com',
      roles: ['mentor'],
    };

    const response = await request(app.getHttpServer())
      .get(`/appointments/${APPOINTMENT_ID}`)
      .set('Authorization', `Bearer ${tokenFor(OTHER_USER_ID)}`)
      .expect(403);

    expect(response.body).toMatchObject({
      statusCode: 403,
      ok: false,
      data: null,
    });
    const serialized = JSON.stringify(response.body);
    for (const sensitiveValue of [
      'Ana',
      'Pérez',
      'Luis',
      'Flores',
      'Orientación profesional',
      '2026-10-23',
      APPOINTMENT_ID,
    ]) {
      expect(serialized).not.toContain(sensitiveValue);
    }
  });

  it('returns 404 for an unknown appointment', async () => {
    findUnique.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .get(`/appointments/${APPOINTMENT_ID}`)
      .set('Authorization', `Bearer ${tokenFor(MENTOR_ID)}`)
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      ok: false,
      data: null,
    });
  });

  it('rejects a malformed UUID before querying detail', async () => {
    await request(app.getHttpServer())
      .get('/appointments/not-a-uuid')
      .set('Authorization', `Bearer ${tokenFor(MENTOR_ID)}`)
      .expect(400);

    expect(findUnique).not.toHaveBeenCalled();
  });

  it('returns [] only when the query succeeds with no records', async () => {
    findMany.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get('/appointments/me')
      .set('Authorization', `Bearer ${tokenFor(MENTOR_ID)}`)
      .expect(200);

    expect(response.body).toMatchObject({ ok: true, data: [] });
  });

  it('returns a server error instead of [] when the database query fails', async () => {
    findMany.mockRejectedValue(new Error('Database unavailable'));

    const response = await request(app.getHttpServer())
      .get('/appointments/me')
      .set('Authorization', `Bearer ${tokenFor(MENTOR_ID)}`)
      .expect(500);

    expect(response.body.data).not.toEqual([]);
  });
});
