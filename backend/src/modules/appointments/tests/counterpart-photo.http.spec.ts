import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { SessionService } from '../../../common/services/session.service.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { PhotoNotFoundException } from '../../profile/exceptions/photo-not-found.exception.js';
import { ProfilePhotoService } from '../../profile/services/profile-photo.service.js';
import { AppointmentsModule } from '../appointments.module.js';
import {
  APPOINTMENT_ID,
  createAppointmentRecord,
  MENTOR_ID,
  OTHER_USER_ID,
  STUDENT_ID,
} from './fixtures/appointment-record.fixture.js';

describe('GET /appointments/:id/counterpart-photo', () => {
  const findUnique = vi.fn();
  const getPhoto = vi.fn();
  const getAuthenticatedUser = vi.fn();
  const jwtService = new JwtService({ secret: 'counterpart-photo-test-secret' });
  const photo = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  let app: INestApplication;
  let sessionUser: AuthenticatedUser;

  const tokenFor = (userId: string, role: string) =>
    jwtService.sign({ sub: userId, roleTag: role, roles: [role] });

  const requestPhoto = (userId: string, role: string, id = APPOINTMENT_ID) =>
    request(app.getHttpServer())
      .get(`/appointments/${id}/counterpart-photo`)
      .set('Authorization', `Bearer ${tokenFor(userId, role)}`);

  const signIn = (id: string, role: string) => {
    sessionUser = { id, email: `${role}@test.com`, roles: [role] };
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    signIn(STUDENT_ID, 'titulado');
    getAuthenticatedUser.mockImplementation(async () => sessionUser);
    findUnique.mockResolvedValue(createAppointmentRecord());
    getPhoto.mockResolvedValue({ content: photo, mimeType: 'image/png' });

    const moduleRef = await Test.createTestingModule({
      imports: [AppointmentsModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ appointment: { findUnique } })
      .overrideProvider(SessionService)
      .useValue({ getAuthenticatedUser })
      .overrideProvider(JwtService)
      .useValue(jwtService)
      .overrideProvider(ProfilePhotoService)
      .useValue({ getPhoto })
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

  it.each([
    [STUDENT_ID, 'titulado', MENTOR_ID],
    [MENTOR_ID, 'mentor', STUDENT_ID],
  ])(
    'returns to %s (%s) the raw photo of the counterpart %s',
    async (userId, role, counterpartId) => {
      signIn(userId, role);

      const response = await requestPhoto(userId, role)
        .buffer(true)
        .parse((res, done) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => done(null, Buffer.concat(chunks)));
        })
        .expect(200);

      expect(response.headers['content-type']).toBe('image/png');
      expect(response.headers['content-disposition']).toBe('inline');
      expect(response.body).toEqual(photo);
      expect(getPhoto).toHaveBeenCalledExactlyOnceWith(counterpartId);
    },
  );

  it('returns 403 without reading any photo for a user outside the appointment', async () => {
    signIn(OTHER_USER_ID, 'mentor');

    const response = await requestPhoto(OTHER_USER_ID, 'mentor').expect(403);

    expect(response.body).toMatchObject({ statusCode: 403, ok: false, data: null });
    expect(getPhoto).not.toHaveBeenCalled();
  });

  it('returns 404 when the counterpart has no photo', async () => {
    getPhoto.mockRejectedValue(new PhotoNotFoundException());

    const response = await requestPhoto(STUDENT_ID, 'titulado').expect(404);

    expect(response.body).toMatchObject({ statusCode: 404, ok: false, data: null });
  });

  it('returns 404 for an unknown appointment without reading any photo', async () => {
    findUnique.mockResolvedValue(null);

    await requestPhoto(STUDENT_ID, 'titulado').expect(404);

    expect(getPhoto).not.toHaveBeenCalled();
  });

  it('rejects a malformed id before querying the appointment', async () => {
    await requestPhoto(STUDENT_ID, 'titulado', 'not-a-uuid').expect(400);

    expect(findUnique).not.toHaveBeenCalled();
    expect(getPhoto).not.toHaveBeenCalled();
  });

  it('requires authentication', async () => {
    await request(app.getHttpServer())
      .get(`/appointments/${APPOINTMENT_ID}/counterpart-photo`)
      .expect(401);

    expect(findUnique).not.toHaveBeenCalled();
  });
});
