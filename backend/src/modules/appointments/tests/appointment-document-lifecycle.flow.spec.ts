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
import { PhotoNotFoundException } from '../../profile/exceptions/photo-not-found.exception.js';
import { ProfilePhotoService } from '../../profile/services/profile-photo.service.js';
import { AppointmentsModule } from '../appointments.module.js';
import { APPOINTMENT_MESSAGES } from '../constants/appointment-docs.constants.js';
import { AppointmentDocumentsRepository } from '../repositories/appointment-documents.repository.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import type { AppointmentDocumentFileRecord } from '../types/appointment-document-file-record.types.js';
import type { SaveAppointmentDocumentData } from '../types/save-appointment-document-data.types.js';
import {
  JPG_CONTENT,
  PDF_CONTENT,
  PNG_CONTENT,
} from './fixtures/appointment-document.fixture.js';
import {
  APPOINTMENT_ID,
  createAppointmentRecord,
  MENTOR_ID,
  NOW,
  OTHER_USER_ID,
  STUDENT_ID,
} from './fixtures/appointment-record.fixture.js';

describe('Appointment document lifecycle with in-memory repositories', () => {
  const jwt = new JwtService({ secret: 'appointment-document-flow' });
  const url = `/appointments/${APPOINTMENT_ID}`;
  let app: INestApplication;
  let appointment: ReturnType<typeof createAppointmentRecord>;
  let documents: Map<string, AppointmentDocumentFileRecord>;
  let photos: Map<string, Buffer>;
  const getPhoto = vi.fn();

  const authorization = (id: string) =>
    `Bearer ${jwt.sign({
      sub: id,
      roleTag: id === MENTOR_ID ? 'mentor' : 'titulado',
    })}`;
  const metadata = (document: AppointmentDocumentFileRecord) => ({
    fileName: document.fileName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    uploadedAt: document.uploadedAt,
  });
  const record = () => ({
    ...appointment,
    document: documents.has(APPOINTMENT_ID)
      ? metadata(documents.get(APPOINTMENT_ID)!)
      : null,
  });
  const upload = (
    content: Buffer,
    fileName = 'document.pdf',
    userId = STUDENT_ID,
  ) =>
    request(app.getHttpServer())
      .post(`${url}/document`)
      .set('Authorization', authorization(userId))
      .attach('file', content, fileName);
  const read = (path: string, id = STUDENT_ID) =>
    request(app.getHttpServer())
      .get(path)
      .set('Authorization', authorization(id));
  const binary = (path: string, id: string) =>
    read(path, id)
      .buffer(true)
      .parse((response, done) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => done(null, Buffer.concat(chunks)));
      });

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    appointment = createAppointmentRecord({ message: 'Revisa mi documento' });
    documents = new Map();
    photos = new Map([
      [MENTOR_ID, PNG_CONTENT],
      [STUDENT_ID, JPG_CONTENT],
    ]);
    getPhoto.mockReset().mockImplementation(async (id: string) => {
      const content = photos.get(id);
      if (!content) throw new PhotoNotFoundException();
      return {
        content,
        mimeType: id === MENTOR_ID ? 'image/png' : 'image/jpeg',
      };
    });
    const module = await Test.createTestingModule({
      imports: [AppointmentsModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(JwtService)
      .useValue(jwt)
      .overrideProvider(SessionService)
      .useValue({
        getAuthenticatedUser: async (id: string) => ({
          id,
          email: `${id}@umssy.test`,
          roles: [id === MENTOR_ID ? 'mentor' : 'titulado'],
        }),
      })
      .overrideProvider(AppointmentsRepository)
      .useValue({
        findById: async (id: string) =>
          id === appointment.id ? record() : null,
        findMine: async (id: string) =>
          [appointment.mentorId, appointment.studentId].includes(id)
            ? [record()]
            : [],
      })
      .overrideProvider(AppointmentDocumentsRepository)
      .useValue({
        save: async (id: string, data: SaveAppointmentDocumentData) => {
          const document = {
            ...data,
            data: new Uint8Array(data.data),
            uploadedAt: new Date(),
          };
          documents.set(id, document);
          return metadata(document);
        },
        findFile: async (id: string) => documents.get(id) ?? null,
      })
      .overrideProvider(ProfilePhotoService)
      .useValue({ getPhoto })
      .compile();
    app = module.createNestApplication({ logger: false });
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
    vi.useRealTimers();
  });

  it.each([
    ['document.pdf', PDF_CONTENT, 'application/pdf'],
    ['document.png', PNG_CONTENT, 'image/png'],
    ['document.jpg', JPG_CONTENT, 'image/jpeg'],
  ])(
    'persists %s across upload, detail, list and both downloads',
    async (name, content, mimeType) => {
      const uploaded = await upload(content, name).expect(201);
      expect(uploaded.body.data).toMatchObject({
        fileName: name,
        mimeType,
        sizeBytes: content.length,
      });
      for (const id of [STUDENT_ID, MENTOR_ID]) {
        const detail = await read(url, id).expect(200);
        const list = await read('/appointments/me', id).expect(200);
        expect(detail.body.data).toMatchObject({
          message: appointment.message,
          requestedAt: appointment.requestedAt.toISOString(),
          document: uploaded.body.data,
        });
        expect(list.body.data[0].document).toEqual(uploaded.body.data);
        const download = await binary(`${url}/document`, id).expect(200);
        expect(download.body).toEqual(content);
        expect(download.headers['content-type']).toBe(mimeType);
        expect(download.headers['content-disposition']).toContain(
          `filename="${name}"`,
        );
        expect(download.headers['content-disposition']).toMatch(/^attachment;/);
      }
    },
  );

  it('replaces the stored document and exposes only the new bytes and metadata', async () => {
    await upload(PDF_CONTENT).expect(201);
    vi.setSystemTime(new Date(NOW.getTime() + 60_000));
    const replacement = await upload(PNG_CONTENT, 'replacement.png').expect(
      201,
    );
    expect(documents.size).toBe(1);
    expect(replacement.body.data.uploadedAt).toBe(new Date().toISOString());
    const detail = await read(url).expect(200);
    expect(detail.body.data.document).toEqual(replacement.body.data);
    const list = await read('/appointments/me').expect(200);
    expect(list.body.data[0].document).toEqual(replacement.body.data);
    const download = await binary(`${url}/document`, MENTOR_ID).expect(200);
    expect(download.body).toEqual(PNG_CONTENT);
  });

  it.each([
    ['unsupported', Buffer.from('unsupported document'), 415],
    [
      'too large',
      Buffer.concat([PDF_CONTENT, Buffer.alloc(5 * 1024 * 1024)]),
      413,
    ],
    ['damaged', PDF_CONTENT.subarray(0, PDF_CONTENT.length - 10), 400],
  ])(
    'rejects %s content without replacing the previous document',
    async (_name, content, status) => {
      await upload(PDF_CONTENT).expect(201);
      await upload(content).expect(status);
      const download = await binary(`${url}/document`, STUDENT_ID).expect(200);
      expect(download.body).toEqual(PDF_CONTENT);
      expect(documents.size).toBe(1);
    },
  );

  it.each([MENTOR_ID, OTHER_USER_ID])(
    'forbids upload by %s without changing storage',
    async (id) => {
      await upload(PDF_CONTENT).expect(201);
      await upload(PNG_CONTENT, 'forbidden.png', id).expect(403);
      expect(Buffer.from(documents.get(APPOINTMENT_ID)!.data)).toEqual(
        PDF_CONTENT,
      );
    },
  );

  it('prevents outsiders from reading document, detail, photo or list entries', async () => {
    await upload(PDF_CONTENT).expect(201);
    for (const path of [url, `${url}/document`, `${url}/counterpart-photo`]) {
      await read(path, OTHER_USER_ID).expect(403);
    }
    const list = await read('/appointments/me', OTHER_USER_ID).expect(200);
    expect(list.body.data).toEqual([]);
    expect(getPhoto).not.toHaveBeenCalled();
  });

  it('returns null metadata for a historical message-less appointment and 404 for its missing document', async () => {
    appointment.message = null;
    const detail = await read(url).expect(200);
    expect(detail.body.data).toMatchObject({ message: null, document: null });
    await read(`${url}/document`).expect(404);
  });

  it.each([STUDENT_ID, MENTOR_ID])(
    'returns the actual counterpart photo to %s',
    async (id) => {
      const counterpart = id === STUDENT_ID ? MENTOR_ID : STUDENT_ID;
      const response = await binary(`${url}/counterpart-photo`, id).expect(200);
      expect(response.body).toEqual(photos.get(counterpart));
      expect(getPhoto).toHaveBeenCalledExactlyOnceWith(counterpart);
      photos.delete(counterpart);
      await read(`${url}/counterpart-photo`, id).expect(404);
    },
  );

  it.each(['CANCELLED', 'COMPLETED'])(
    'rejects uploads to a %s appointment',
    async (title) => {
      appointment.status.title = title;
      await upload(PDF_CONTENT).expect(409);
      expect(documents.size).toBe(0);
    },
  );

  it('rejects uploads at the exact appointment end time', async () => {
    vi.setSystemTime(appointment.endAt);
    await upload(PDF_CONTENT).expect(409);
    expect(documents.size).toBe(0);
  });

  it.each([{}, { message: '   ' }])(
    'rejects an empty appointment message: %j',
    async (message) => {
      const response = await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', authorization(STUDENT_ID))
        .send({
          blockId: appointment.blockId,
          orientationTypeId: appointment.orientationType?.id,
          ...message,
        })
        .expect(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'message',
          message: APPOINTMENT_MESSAGES.missingMessage,
        }),
      );
      expect(documents.size).toBe(0);
    },
  );
});
