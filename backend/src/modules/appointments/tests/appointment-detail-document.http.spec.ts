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
import { ProfilePhotoService } from '../../profile/services/profile-photo.service.js';
import { AppointmentsModule } from '../appointments.module.js';
import {
  createDocumentFileRecord,
  DOCUMENT_UPLOADED_AT,
  PDF_CONTENT,
} from './fixtures/appointment-document.fixture.js';
import {
  APPOINTMENT_ID,
  createAppointmentRecord,
  MENTOR_ID,
  STUDENT_ID,
} from './fixtures/appointment-record.fixture.js';

describe('Appointment detail and its document over HTTP', () => {
  const findAppointment = vi.fn();
  const findMany = vi.fn();
  const upsertDocument = vi.fn();
  const findDocument = vi.fn();
  const getPhoto = vi.fn();
  const getAuthenticatedUser = vi.fn();
  const jwtService = new JwtService({ secret: 'appointment-detail-document' });
  const { data: _data, ...documentMetadata } = createDocumentFileRecord();
  const expectedDocument = {
    fileName: 'Tesis_capitulo_2.pdf',
    mimeType: 'application/pdf',
    sizeBytes: PDF_CONTENT.length,
    uploadedAt: DOCUMENT_UPLOADED_AT.toISOString(),
  };
  let app: INestApplication;
  let sessionUser: AuthenticatedUser;

  function signIn(userId: string, role: string): string {
    sessionUser = { id: userId, email: `${role}@test.com`, roles: [role] };
    return `Bearer ${jwtService.sign({ sub: userId, roleTag: role, roles: [role] })}`;
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-22T15:00:00.000Z'));
    getAuthenticatedUser.mockImplementation(async () => sessionUser);
    findAppointment.mockResolvedValue(
      createAppointmentRecord({
        message: 'Revisa mi tesis',
        document: documentMetadata,
      }),
    );
    findMany.mockResolvedValue([
      createAppointmentRecord({ document: documentMetadata }),
    ]);
    upsertDocument.mockResolvedValue(documentMetadata);
    findDocument.mockResolvedValue(createDocumentFileRecord());
    getPhoto.mockResolvedValue({
      content: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      mimeType: 'image/png',
    });

    const moduleRef = await Test.createTestingModule({
      imports: [AppointmentsModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        appointment: { findUnique: findAppointment, findMany },
        appointmentDocument: {
          upsert: upsertDocument,
          findUnique: findDocument,
        },
      })
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
    vi.useRealTimers();
    await app.close();
  });

  it('returns the same document shape when uploading and when reading the detail', async () => {
    const upload = await request(app.getHttpServer())
      .post(`/appointments/${APPOINTMENT_ID}/document`)
      .set('Authorization', signIn(STUDENT_ID, 'titulado'))
      .attach('file', PDF_CONTENT, 'Tesis_capitulo_2.pdf')
      .expect(201);
    const detail = await request(app.getHttpServer())
      .get(`/appointments/${APPOINTMENT_ID}`)
      .set('Authorization', signIn(MENTOR_ID, 'mentor'))
      .expect(200);

    expect(upload.body.data).toEqual(expectedDocument);
    expect(detail.body.data.document).toEqual(expectedDocument);
    expect(detail.body.data.message).toBe('Revisa mi tesis');
  });

  it('includes the document metadata in every appointment of /me', async () => {
    const response = await request(app.getHttpServer())
      .get('/appointments/me')
      .set('Authorization', signIn(MENTOR_ID, 'mentor'))
      .expect(200);

    expect(response.body.data[0].document).toEqual(expectedDocument);
  });

  it.each([
    ['/document', 'application/pdf'],
    ['/counterpart-photo', 'image/png'],
  ])(
    'serves %s from its own handler instead of the detail route',
    async (suffix, contentType) => {
      const response = await request(app.getHttpServer())
        .get(`/appointments/${APPOINTMENT_ID}${suffix}`)
        .set('Authorization', signIn(STUDENT_ID, 'titulado'))
        .expect(200);

      expect(response.headers['content-type']).toBe(contentType);
    },
  );
});
