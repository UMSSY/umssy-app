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
import { APPOINTMENT_DOCUMENT_UPLOAD_LIMIT_BYTES } from '../constants/appointment-document.constants.js';
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
  OTHER_USER_ID,
  STUDENT_ID,
} from './fixtures/appointment-record.fixture.js';

describe('Appointment documents HTTP', () => {
  const findAppointment = vi.fn();
  const upsertDocument = vi.fn();
  const findDocument = vi.fn();
  const getAuthenticatedUser = vi.fn();
  const jwtService = new JwtService({ secret: 'appointment-documents-test' });
  const documentUrl = `/appointments/${APPOINTMENT_ID}/document`;
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
    findAppointment.mockResolvedValue(createAppointmentRecord());
    upsertDocument.mockImplementation(async ({ create }) => ({
      fileName: create.fileName,
      mimeType: create.mimeType,
      sizeBytes: create.sizeBytes,
      uploadedAt: DOCUMENT_UPLOADED_AT,
    }));
    findDocument.mockResolvedValue(createDocumentFileRecord());

    const moduleRef = await Test.createTestingModule({
      imports: [AppointmentsModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        appointment: { findUnique: findAppointment },
        appointmentDocument: {
          upsert: upsertDocument,
          findUnique: findDocument,
        },
      })
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
    vi.useRealTimers();
    await app.close();
  });

  describe('POST /appointments/:id/document', () => {
    it('saves the document of the student and answers inside the global envelope', async () => {
      const response = await request(app.getHttpServer())
        .post(documentUrl)
        .set('Authorization', signIn(STUDENT_ID, 'titulado'))
        .attach('file', PDF_CONTENT, {
          filename: 'Tesis_capitulo_2.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      expect(response.body).toEqual({
        statusCode: 201,
        ok: true,
        detail: expect.any(String),
        data: {
          fileName: 'Tesis_capitulo_2.pdf',
          mimeType: 'application/pdf',
          sizeBytes: PDF_CONTENT.length,
          uploadedAt: DOCUMENT_UPLOADED_AT.toISOString(),
        },
      });
      expect(upsertDocument).toHaveBeenCalledOnce();
    });

    it.each([
      ['not PDF, PNG or JPG', Buffer.from('a'.repeat(120)), 415],
      [
        'over 5 MB',
        Buffer.concat([PDF_CONTENT, Buffer.alloc(5 * 1024 * 1024)]),
        413,
      ],
      ['damaged', PDF_CONTENT.subarray(0, PDF_CONTENT.length - 10), 400],
    ])(
      'rejects a file that is %s with the shared file error',
      async (_case, content, status) => {
        const response = await request(app.getHttpServer())
          .post(documentUrl)
          .set('Authorization', signIn(STUDENT_ID, 'titulado'))
          .attach('file', content, {
            filename: 'tesis.pdf',
            contentType: 'application/pdf',
          })
          .expect(status);

        expect(response.body.ok).toBe(false);
        expect(upsertDocument).not.toHaveBeenCalled();
      },
    );

    it('rejects a request without file with 400', async () => {
      await request(app.getHttpServer())
        .post(documentUrl)
        .set('Authorization', signIn(STUDENT_ID, 'titulado'))
        .expect(400);

      expect(upsertDocument).not.toHaveBeenCalled();
    });

    it('rejects a file over the multipart limit before reading it', async () => {
      await request(app.getHttpServer())
        .post(documentUrl)
        .set('Authorization', signIn(STUDENT_ID, 'titulado'))
        .attach(
          'file',
          Buffer.alloc(APPOINTMENT_DOCUMENT_UPLOAD_LIMIT_BYTES + 1),
          {
            filename: 'enorme.pdf',
            contentType: 'application/pdf',
          },
        )
        .expect(413);

      expect(upsertDocument).not.toHaveBeenCalled();
    });

    it.each([
      ['the mentor of the appointment', MENTOR_ID, 'mentor'],
      ['a user outside the appointment', OTHER_USER_ID, 'titulado'],
    ])('answers 403 to %s', async (_case, userId, role) => {
      const response = await request(app.getHttpServer())
        .post(documentUrl)
        .set('Authorization', signIn(userId, role))
        .attach('file', PDF_CONTENT, 'Tesis.pdf')
        .expect(403);

      expect(response.body.ok).toBe(false);
      expect(upsertDocument).not.toHaveBeenCalled();
    });

    it('answers 409 when the appointment already ended', async () => {
      findAppointment.mockResolvedValue(
        createAppointmentRecord({
          endAt: new Date('2026-10-22T14:00:00.000Z'),
        }),
      );

      await request(app.getHttpServer())
        .post(documentUrl)
        .set('Authorization', signIn(STUDENT_ID, 'titulado'))
        .attach('file', PDF_CONTENT, 'Tesis.pdf')
        .expect(409);
    });

    it('validates the appointment id before reading it', async () => {
      await request(app.getHttpServer())
        .post('/appointments/not-a-uuid/document')
        .set('Authorization', signIn(STUDENT_ID, 'titulado'))
        .attach('file', PDF_CONTENT, 'Tesis.pdf')
        .expect(400);

      expect(findAppointment).not.toHaveBeenCalled();
    });

    it('requires a session', async () => {
      await request(app.getHttpServer())
        .post(documentUrl)
        .attach('file', PDF_CONTENT, 'Tesis.pdf')
        .expect(401);
    });
  });

  describe('GET /appointments/:id/document', () => {
    it.each([
      ['mentor', MENTOR_ID, 'mentor'],
      ['student', STUDENT_ID, 'titulado'],
    ])(
      'lets the %s download the raw file with its original name',
      async (_case, userId, role) => {
        const response = await request(app.getHttpServer())
          .get(documentUrl)
          .set('Authorization', signIn(userId, role))
          .buffer(true)
          .parse((res, callback) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk: Buffer) => chunks.push(chunk));
            res.on('end', () => callback(null, Buffer.concat(chunks)));
          })
          .expect(200);

        expect(response.headers['content-type']).toBe('application/pdf');
        expect(response.headers['content-disposition']).toBe(
          `attachment; filename="Tesis_capitulo_2.pdf"; filename*=UTF-8''Tesis_capitulo_2.pdf`,
        );
        expect(Buffer.compare(response.body as Buffer, PDF_CONTENT)).toBe(0);
      },
    );

    it('answers 403 to a user outside the appointment', async () => {
      await request(app.getHttpServer())
        .get(documentUrl)
        .set('Authorization', signIn(OTHER_USER_ID, 'titulado'))
        .expect(403);

      expect(findDocument).not.toHaveBeenCalled();
    });

    it('answers 404 when the appointment has no document', async () => {
      findDocument.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get(documentUrl)
        .set('Authorization', signIn(STUDENT_ID, 'titulado'))
        .expect(404);

      expect(response.body.ok).toBe(false);
    });

    it('answers 404 when the appointment does not exist', async () => {
      findAppointment.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(documentUrl)
        .set('Authorization', signIn(MENTOR_ID, 'mentor'))
        .expect(404);
    });
  });
});
