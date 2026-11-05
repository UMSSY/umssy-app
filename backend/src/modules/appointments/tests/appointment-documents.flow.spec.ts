import type { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { FIXTURE_PDF } from '../../../common/constants/seed-fixture-document.constants.js';
import { FixtureContext } from '../../../common/database/fixture-context.js';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  FIXTURE_APPOINTMENTS,
  FIXTURE_APPOINTMENT_STATUSES,
} from '../../availability/constants/seed-fixture-appointments.constants.js';
import { seedAppointmentDocumentFixture } from '../../availability/seeds/appointment-documents-fixtures.seed.js';
import { buildAppointmentFixtures } from '../../availability/seeds/appointments-fixtures.seed.js';
import { PhotoFileRepository } from '../../profile/repositories/photo-file.repository.js';
import { ProfileRepository } from '../../profile/repositories/profile.repository.js';
import type { Prisma } from '../../../prisma/client.js';
import { AppointmentsModule } from '../appointments.module.js';
import { AppointmentDocumentsRepository } from '../repositories/appointment-documents.repository.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import type { SaveAppointmentDocumentData } from '../types/save-appointment-document-data.types.js';
import {
  JPG_CONTENT,
  PNG_CONTENT,
} from './fixtures/appointment-document.fixture.js';

const NOW = new Date('2026-10-22T15:00:00.000Z');
const OUTSIDER = '99999999-9999-4999-8999-999999999999';
const SEEDED_DOCUMENT_NAME = 'documento-ejemplo.pdf';

interface StoredDocument extends SaveAppointmentDocumentData {
  uploadedAt: Date;
}

interface Store {
  appointments: ReturnType<typeof buildAppointmentFixtures>;
  documents: Map<string, StoredDocument>;
  photos: Map<string, Buffer>;
  roles: Map<string, string>;
}

const context = new FixtureContext(NOW, 'fixture-admin');
FIXTURE_APPOINTMENT_STATUSES.forEach((status) =>
  context.setReference('appointment_statuses', status, `status-${status}`),
);
FIXTURE_APPOINTMENTS.forEach((plan) =>
  context.setReference(
    'orientation_types',
    plan.orientation,
    `topic-${plan.orientation}`,
  ),
);

const confirmedOf = (planIndex: number) =>
  context.getId(FIXTURE_APPOINTMENTS[planIndex].appointmentKeys[5]);
const completedOf = (planIndex: number) =>
  context.getId(FIXTURE_APPOINTMENTS[planIndex].appointmentKeys[0]);
const statusTitle = (statusId: string) => statusId.replace('status-', '');

async function createStore(): Promise<Store> {
  const appointments = buildAppointmentFixtures(context);
  const documents = new Map<string, StoredDocument>();
  const seedTx = {
    appointmentDocument: {
      upsert: ({ where, create }: Prisma.AppointmentDocumentUpsertArgs) => {
        if (!documents.has(where.appointmentId as string)) {
          const { appointmentId, ...document } =
            create as Prisma.AppointmentDocumentUncheckedCreateInput;
          documents.set(appointmentId, {
            ...(document as SaveAppointmentDocumentData),
            data: Buffer.from(document.data as Uint8Array),
            uploadedAt: NOW,
          });
        }
        return Promise.resolve();
      },
    },
  } as unknown as Prisma.TransactionClient;
  await seedAppointmentDocumentFixture(seedTx, confirmedOf(0));

  const roles = new Map<string, string>([[OUTSIDER, 'titulado']]);
  appointments.forEach((appointment) => {
    roles.set(appointment.mentorId, 'mentor');
    roles.set(appointment.studentId, 'titulado');
  });

  return { appointments, documents, photos: new Map(), roles };
}

function createRepositories(store: Store) {
  const metadataOf = (appointmentId: string) => {
    const document = store.documents.get(appointmentId);
    if (!document) return null;
    return {
      fileName: document.fileName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      uploadedAt: document.uploadedAt,
    };
  };
  const person = (id: string) => ({
    id,
    firstName: 'Persona',
    lastName: id.slice(0, 4),
  });
  const toRecord = (appointment: Store['appointments'][number]) => ({
    id: appointment.id,
    blockId: appointment.blockId,
    mentorId: appointment.mentorId,
    studentId: appointment.studentId,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
    message: appointment.message,
    requestedAt: appointment.requestedAt,
    mentor: person(appointment.mentorId),
    student: person(appointment.studentId),
    orientationType: {
      id: appointment.orientationTypeId,
      name: appointment.orientationTypeId.replace('topic-', ''),
    },
    status: { title: statusTitle(appointment.statusId) },
    document: metadataOf(appointment.id),
  });

  const appointmentsRepository = {
    findById: (id: string) => {
      const appointment = store.appointments.find((item) => item.id === id);
      return Promise.resolve(appointment ? toRecord(appointment) : null);
    },
    findMine: (userId: string) =>
      Promise.resolve(
        store.appointments
          .filter(
            (item) =>
              (item.mentorId === userId || item.studentId === userId) &&
              statusTitle(item.statusId) === 'CONFIRMADA',
          )
          .map(toRecord),
      ),
  };

  const documentsRepository = {
    save: (appointmentId: string, document: SaveAppointmentDocumentData) => {
      store.documents.set(appointmentId, {
        ...document,
        uploadedAt: new Date(),
      });
      return Promise.resolve(metadataOf(appointmentId));
    },
    findFile: (appointmentId: string) => {
      const document = store.documents.get(appointmentId);
      return Promise.resolve(
        document
          ? {
              ...metadataOf(appointmentId),
              data: new Uint8Array(document.data),
            }
          : null,
      );
    },
  };

  const profileRepository = {
    findByUserId: (userId: string) =>
      Promise.resolve(store.roles.has(userId) ? { userId } : null),
  };
  const photoFileRepository = {
    read: (userId: string) => Promise.resolve(store.photos.get(userId) ?? null),
  };

  return {
    appointmentsRepository,
    documentsRepository,
    profileRepository,
    photoFileRepository,
  };
}

describe('Documento y detalle de la cita (integración HTTP con el seed de citas)', () => {
  const jwt = new JwtService({ secret: 'appointment-documents-flow-secret' });
  const seeded = buildAppointmentFixtures(context).find(
    (item) => item.id === confirmedOf(0),
  )!;
  const other = buildAppointmentFixtures(context).find(
    (item) => item.id === confirmedOf(1),
  )!;
  const MENTOR = seeded.mentorId;
  const STUDENT = seeded.studentId;
  let app: INestApplication;
  let store: Store;

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    store = await createStore();
    const repositories = createRepositories(store);
    const moduleRef = await Test.createTestingModule({
      imports: [AppointmentsModule],
      providers: [
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findFirst: ({ where }: { where: { id: string } }) =>
            Promise.resolve(
              store.roles.has(where.id)
                ? {
                    id: where.id,
                    email: `${where.id}@umssy.test`,
                    roles: [{ role: { name: store.roles.get(where.id) } }],
                  }
                : null,
            ),
        },
      })
      .overrideProvider(JwtService)
      .useValue(jwt)
      .overrideProvider(AppointmentsRepository)
      .useValue(repositories.appointmentsRepository)
      .overrideProvider(AppointmentDocumentsRepository)
      .useValue(repositories.documentsRepository)
      .overrideProvider(ProfileRepository)
      .useValue(repositories.profileRepository)
      .overrideProvider(PhotoFileRepository)
      .useValue(repositories.photoFileRepository)
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const tokenOf = (userId: string) =>
    `Bearer ${jwt.sign({ sub: userId, roleTag: store.roles.get(userId) })}`;
  const upload = (
    userId: string,
    appointmentId: string,
    content: Buffer,
    name: string,
  ) =>
    http()
      .post(`/api/appointments/${appointmentId}/document`)
      .set('Authorization', tokenOf(userId))
      .attach('file', content, name);
  const download = (userId: string, appointmentId: string) =>
    http()
      .get(`/api/appointments/${appointmentId}/document`)
      .set('Authorization', tokenOf(userId))
      .buffer(true)
      .parse((res, done) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => done(null, Buffer.concat(chunks)));
      });
  const detail = (userId: string, appointmentId: string) =>
    http()
      .get(`/api/appointments/${appointmentId}`)
      .set('Authorization', tokenOf(userId));

  it('1. el seed deja un documento en la cita confirmada y el detalle lo muestra', async () => {
    const response = await detail(MENTOR, seeded.id).expect(200);

    expect(response.body.data).toMatchObject({
      message: seeded.message,
      requestedAt: seeded.requestedAt.toISOString(),
      document: {
        fileName: SEEDED_DOCUMENT_NAME,
        mimeType: 'application/pdf',
        sizeBytes: FIXTURE_PDF.length,
      },
    });
  });

  it.each([
    ['PDF', FIXTURE_PDF, 'Tesis.pdf', 'application/pdf'],
    ['PNG', PNG_CONTENT, 'Diseño.png', 'image/png'],
    ['JPG', JPG_CONTENT, 'Foto.jpg', 'image/jpeg'],
  ])(
    '2. el titulado sube un %s y el mentor lo ve en el detalle y lo descarga',
    async (_type, content, name, mimeType) => {
      await upload(other.studentId, other.id, content, name).expect(201);

      const response = await detail(other.mentorId, other.id).expect(200);
      expect(response.body.data.document).toMatchObject({
        fileName: name,
        mimeType,
        sizeBytes: content.length,
      });
    },
  );

  it('3. subir otra vez reemplaza el documento anterior', async () => {
    await upload(STUDENT, seeded.id, PNG_CONTENT, 'Plano.png').expect(201);

    const file = await download(MENTOR, seeded.id).expect(200);
    const response = await detail(STUDENT, seeded.id).expect(200);

    expect(Buffer.compare(file.body as Buffer, PNG_CONTENT)).toBe(0);
    expect(file.headers['content-disposition']).toContain(
      'filename="Plano.png"',
    );
    expect(response.body.data.document.fileName).toBe('Plano.png');
    expect(store.documents.size).toBe(1);
  });

  it.each([
    ['de otro tipo', Buffer.from('a'.repeat(120)), 415],
    [
      'de más de 5 MB',
      Buffer.concat([FIXTURE_PDF, Buffer.alloc(5 * 1024 * 1024)]),
      413,
    ],
    ['dañado', FIXTURE_PDF.subarray(0, FIXTURE_PDF.length - 10), 400],
  ])(
    '4. un archivo %s se rechaza y el documento del seed sigue igual',
    async (_case, content, status) => {
      await upload(STUDENT, seeded.id, content, 'tesis.pdf').expect(status);

      const file = await download(MENTOR, seeded.id).expect(200);
      expect(Buffer.compare(file.body as Buffer, FIXTURE_PDF)).toBe(0);
    },
  );
});
