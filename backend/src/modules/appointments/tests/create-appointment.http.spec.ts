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
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { AvailabilityRepository } from '../../availability/repositories/availability.repository.js';
import { BlockedDatesService } from '../../availability/services/blocked-dates.service.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { AppointmentsModule } from '../appointments.module.js';
import { APPOINTMENT_MESSAGES } from '../constants/appointment-docs.constants.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import {
  APPOINTMENT_ID,
  createAppointmentRecord,
  MENTOR_ID,
  STUDENT_ID,
} from './fixtures/appointment-record.fixture.js';

const BLOCK_ID = '55555555-5555-4555-8555-555555555555';
const TOPIC_ID = '66666666-6666-4666-8666-666666666666';
const STATUS_ID = '77777777-7777-4777-8777-777777777777';
const TX = { kind: 'tx' };

const SESSION_USERS: Record<string, string> = {
  [STUDENT_ID]: 'estudiante',
  [MENTOR_ID]: 'mentor',
};

const block = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => {
  const startAt = new Date(Date.now() + 60 * 60 * 1000);
  return {
    id: BLOCK_ID,
    mentorId: MENTOR_ID,
    startAt,
    endAt: new Date(startAt.getTime() + 30 * 60 * 1000),
    seriesId: null,
    repeatUntil: null,
    createdAt: new Date('2026-10-01T12:00:00.000Z'),
    updatedAt: new Date('2026-10-01T12:00:00.000Z'),
    appointments: [],
    ...overrides,
  };
};

describe('POST /appointments (integración HTTP)', () => {
  const jwt = new JwtService({ secret: 'create-appointment-http-secret' });
  const token = jwt.sign({ sub: STUDENT_ID, roleTag: 'estudiante' });
  const mentorToken = jwt.sign({ sub: MENTOR_ID, roleTag: 'mentor' });
  const findById = vi.fn();
  const findStatusIdByTitle = vi.fn();
  const createAppointment = vi.fn();
  const findOne = vi.fn();
  let app: INestApplication;

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-22T15:00:00.000Z') });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    findById.mockResolvedValue(block());
    findStatusIdByTitle.mockResolvedValue(STATUS_ID);
    createAppointment.mockResolvedValue(createAppointmentRecord());
    findOne.mockResolvedValue({ id: MENTOR_ID, isAvailable: true });

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
              SESSION_USERS[where.id]
                ? {
                    id: where.id,
                    email: `${where.id}@umssy.test`,
                    roles: [{ role: { name: SESSION_USERS[where.id] } }],
                  }
                : null,
            ),
        },
      })
      .overrideProvider(JwtService)
      .useValue(jwt)
      .overrideProvider(AvailabilityRepository)
      .useValue({ findById })
      .overrideProvider(AppointmentsRepository)
      .useValue({ findStatusIdByTitle, createAppointment })
      .overrideProvider(BlockedDatesService)
      .useValue({
        runOnUnblockedDay: (
          _mentorId: string,
          _startAt: Date,
          work: (tx: unknown) => Promise<unknown>,
        ) => work(TX),
      })
      .overrideProvider(MentorsService)
      .useValue({ findOne })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const post = (body: Record<string, unknown>, authToken = token) => {
    const req = request(app.getHttpServer()).post('/appointments');
    if (authToken) {
      req.set('Authorization', `Bearer ${authToken}`);
    }
    return req.send(body);
  };

  it('responde 401 cuando no hay sesión', async () => {
    const response = await post({ blockId: BLOCK_ID, orientationTypeId: TOPIC_ID }, '');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ statusCode: 401, ok: false });
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it('responde 403 cuando el rol no puede reservar citas', async () => {
    const response = await post(
      { blockId: BLOCK_ID, orientationTypeId: TOPIC_ID },
      mentorToken,
    );

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ statusCode: 403, ok: false });
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it('responde 400 con el detalle cuando falta el tema', async () => {
    const response = await post({ blockId: BLOCK_ID });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['orientationTypeId'],
          message: APPOINTMENT_MESSAGES.missingTopic,
        }),
      ]),
    );
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it('responde 400 con el detalle cuando el mensaje supera los 300 caracteres', async () => {
    const response = await post({
      blockId: BLOCK_ID,
      orientationTypeId: TOPIC_ID,
      message: 'x'.repeat(301),
    });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: APPOINTMENT_MESSAGES.messageTooLong }),
      ]),
    );
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it('responde 201 con la cita confirmada en el sobre de respuesta', async () => {
    const response = await post({
      blockId: BLOCK_ID,
      orientationTypeId: TOPIC_ID,
      message: 'Quiero reforzar mis bases',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ statusCode: 201, ok: true });
    expect(response.body.data).toMatchObject({
      id: APPOINTMENT_ID,
      blockId: BLOCK_ID,
      orientationType: { id: TOPIC_ID },
      counterpart: { id: MENTOR_ID, fullName: 'Ana Pérez' },
      status: AppointmentStatusTitle.CONFIRMED,
    });
    expect(findStatusIdByTitle).toHaveBeenCalledWith(
      AppointmentStatusTitle.CONFIRMED,
      TX,
    );
    expect(createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        blockId: BLOCK_ID,
        mentorId: MENTOR_ID,
        studentId: STUDENT_ID,
        statusId: STATUS_ID,
        orientationTypeId: TOPIC_ID,
      }),
      TX,
    );
  });

  it('responde 404 cuando el bloque no existe', async () => {
    findById.mockResolvedValue(null);

    const response = await post({
      blockId: BLOCK_ID,
      orientationTypeId: TOPIC_ID,
    });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ statusCode: 404, ok: false });
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it('responde 409 cuando el horario ya fue reservado', async () => {
    findById.mockResolvedValue(
      block({
        appointments: [
          { status: { title: AppointmentStatusTitle.CONFIRMED } },
        ],
      }),
    );

    const response = await post({
      blockId: BLOCK_ID,
      orientationTypeId: TOPIC_ID,
    });

    expect(response.status).toBe(409);
    expect(response.body.detail).toBe('Este horario ya fue reservado');
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it('responde 403 cuando el usuario intenta reservar su propio bloque', async () => {
    findById.mockResolvedValue(block({ mentorId: STUDENT_ID }));

    const response = await post({
      blockId: BLOCK_ID,
      orientationTypeId: TOPIC_ID,
    });

    expect(response.status).toBe(403);
    expect(response.body.detail).toBe(
      'No puedes reservar tu propio horario',
    );
  });

  it('responde 403 cuando el mentor está pausado', async () => {
    findOne.mockResolvedValue({ id: MENTOR_ID, isAvailable: false });

    const response = await post({
      blockId: BLOCK_ID,
      orientationTypeId: TOPIC_ID,
    });

    expect(response.status).toBe(403);
    expect(response.body.detail).toBe(
      'El mentor no está disponible para recibir citas',
    );
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it('responde 400 cuando el bloque ya pasó', async () => {
    const pastStart = new Date(Date.now() - 60 * 60 * 1000);
    findById.mockResolvedValue(
      block({ startAt: pastStart, endAt: new Date(Date.now() - 30 * 60 * 1000) }),
    );

    const response = await post({
      blockId: BLOCK_ID,
      orientationTypeId: TOPIC_ID,
    });

    expect(response.status).toBe(400);
    expect(response.body.detail).toBe('El horario ya pasó');
    expect(createAppointment).not.toHaveBeenCalled();
  });
});
