import type { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import { randomUUID } from 'node:crypto';
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
import { TransactionService } from '../../../common/prisma/transaction.service.js';
import { SessionRepository } from '../../../common/repositories/session.repository.js';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { AvailabilityRepository } from '../../availability/repositories/availability.repository.js';
import { BlockedDatesService } from '../../availability/services/blocked-dates.service.js';
import type { AvailabilityBlockResponse } from '../../availability/types/availability-block-response.types.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { AppointmentsModule } from '../appointments.module.js';
import { PushDispatcherService } from '../../notifications/services/push-dispatcher.service.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';
import {
  CANCELLATION_REASON_MAX_LENGTH,
  CANCELLATION_REASON_WINDOW_MS,
} from '../constants/cancellation.constants.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import type { AppointmentRecord } from '../types/appointment-record.types.js';
import {
  InMemoryOverlapSeed,
  OVERLAP_HTTP_ANCHOR,
  OVERLAP_TOPIC,
  type InMemoryBlock,
  type TestTransaction,
} from './fixtures/overlap-http-seed.fixture.js';

const JWT_SECRET = 'appointments-cancel-http-secret';
const MINUTE = 60 * 1000;
const REASON = 'Me surgió una reunión de trabajo';
const LONG_REASON = 'x'.repeat(CANCELLATION_REASON_MAX_LENGTH);
const TOO_LONG_REASON = 'x'.repeat(CANCELLATION_REASON_MAX_LENGTH + 1);
const WINDOW_MINUTES = CANCELLATION_REASON_WINDOW_MS / MINUTE;

const jwt = new JwtService({ secret: JWT_SECRET });

const minutesFromAnchor = (minutes: number) =>
  new Date(OVERLAP_HTTP_ANCHOR.getTime() + minutes * MINUTE);

describe('PATCH /appointments/:id/cancel (integración HTTP)', () => {
  let app: INestApplication;
  let seed: InMemoryOverlapSeed;
  let mentorId: string;
  let studentId: string;
  let studentToken: string;
  let mentorToken: string;
  let otherStudentToken: string;
  let outsiderToken: string;

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: OVERLAP_HTTP_ANCHOR });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    seed = new InMemoryOverlapSeed();
    mentorId = seed.mentorIdAt(1);
    studentId = seed.studentId;
    studentToken = jwt.sign({ sub: studentId, roleTag: 'estudiante' });
    mentorToken = jwt.sign({ sub: mentorId, roleTag: 'mentor' });
    otherStudentToken = jwt.sign({
      sub: seed.userIdAt(0),
      roleTag: 'estudiante',
    });
    outsiderToken = jwt.sign({
      sub: seed.userIdAt(2),
      roleTag: 'estudiante',
    });

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        AppointmentsModule,
      ],
      providers: [
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
      ],
    })
      .overrideProvider(JwtService)
      .useValue(jwt)
      .overrideProvider(SessionRepository)
      .useValue(seed.sessionRepository)
      .overrideProvider(AvailabilityRepository)
      .useValue(seed.availabilityRepository)
      .overrideProvider(AppointmentsRepository)
      .useValue(seed.appointmentsRepository)
      .overrideProvider(BlockedDatesService)
      .useValue(seed.blockedDatesService)
      .overrideProvider(MentorsService)
      .useValue(seed.mentorsService)
      .overrideProvider(TransactionService)
      .useValue({
        run: async <T>(
          operation: (context: { client: TestTransaction }) => Promise<T>,
        ): Promise<T> => {
          const client: TestTransaction = { releases: [] };
          try {
            return await operation({ client });
          } finally {
            for (const release of client.releases) {
              release();
            }
          }
        },
      })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(PushDispatcherService)
      .useValue({ dispatchToUsers: vi.fn() })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const cancel = (
    id: string,
    token = studentToken,
    body: { reason?: string } = {},
  ) =>
    request(app.getHttpServer())
      .patch(`/appointments/${id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  const getDetail = (id: string, token = studentToken) =>
    request(app.getHttpServer())
      .get(`/appointments/${id}`)
      .set('Authorization', `Bearer ${token}`);

  const freeBlocks = async (mentor = mentorId, token = studentToken) => {
    const response = await request(app.getHttpServer())
      .get(`/mentors/${mentor}/free-blocks`)
      .query({
        from: minutesFromAnchor(0).toISOString(),
        to: minutesFromAnchor(7 * 24 * 60).toISOString(),
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    return response.body.data as AvailabilityBlockResponse[];
  };

  const post = (blockId: string, token = otherStudentToken) =>
    request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        blockId,
        orientationTypeId: OVERLAP_TOPIC.id,
        message: 'Quiero reforzar mis bases',
      });

  const target = (): InMemoryBlock =>
    seed.addBlock(
      mentorId,
      minutesFromAnchor(48 * 60),
      minutesFromAnchor(48 * 60 + 30),
    );

  const addOnBlock = (
    block: InMemoryBlock,
    status: AppointmentStatusTitle = AppointmentStatusTitle.CONFIRMED,
  ): AppointmentRecord =>
    seed.addAppointment({
      blockId: block.id,
      mentorId: block.mentorId,
      studentId,
      startAt: block.startAt,
      endAt: block.endAt,
      status,
    });

  const addAt = (
    startMinute: number,
    status: AppointmentStatusTitle = AppointmentStatusTitle.CONFIRMED,
  ): AppointmentRecord =>
    seed.addAppointment({
      mentorId,
      studentId,
      startAt: minutesFromAnchor(startMinute),
      endAt: minutesFromAnchor(startMinute + 30),
      status,
    });

  it('cancela el titulado con motivo, guarda el historial y libera el bloque (CA1, CA13)', async () => {
    const block = target();
    const appointment = addOnBlock(block);

    const response = await cancel(appointment.id, studentToken, {
      reason: `  ${REASON}  `,
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      status: 'CANCELLED',
      cancellation: {
        cancelledBy: 'STUDENT',
        cancelledByMe: true,
        reason: REASON,
        cancelledAt: OVERLAP_HTTP_ANCHOR.toISOString(),
      },
    });
    expect(seed.historiesOf(appointment.id)).toEqual([
      {
        appointmentId: appointment.id,
        previousStatusId: seed.statusIdOf(AppointmentStatusTitle.CONFIRMED),
        newStatusId: seed.statusIdOf(AppointmentStatusTitle.CANCELLED),
        changedById: studentId,
      },
    ]);

    const detail = await getDetail(appointment.id, mentorToken);
    expect(detail.status).toBe(200);
    expect(detail.body.data.cancellation).toMatchObject({
      cancelledBy: 'STUDENT',
      cancelledByMe: false,
      reason: REASON,
    });

    const blocks = await freeBlocks(block.mentorId);
    expect(blocks.some((item) => item.id === block.id)).toBe(true);

    const booking = await post(block.id);
    expect(booking.status).toBe(201);
    expect(booking.body.data).toMatchObject({ blockId: block.id });
  });

  it('permite cancelar sin motivo con exactamente 24 horas (CA7)', async () => {
    const appointment = addAt(WINDOW_MINUTES);

    const response = await cancel(appointment.id);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      status: 'CANCELLED',
      cancellation: {
        cancelledBy: 'STUDENT',
        cancelledByMe: true,
        reason: null,
      },
    });
  });

  it('permite cancelar sin motivo con más de 24 horas (CA1)', async () => {
    const appointment = addAt(48 * 60);

    const response = await cancel(appointment.id);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      status: 'CANCELLED',
      cancellation: {
        cancelledBy: 'STUDENT',
        cancelledByMe: true,
        reason: null,
      },
    });
  });

  it('rechaza cancelar sin motivo con menos de 24 horas (CA2)', async () => {
    const appointment = addAt(WINDOW_MINUTES - 1);

    const response = await cancel(appointment.id);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      ok: false,
      code: APPOINTMENT_ERROR_CODES.cancelReasonRequired,
      data: null,
    });

    const detail = await getDetail(appointment.id);
    expect(detail.body.data.status).toBe('CONFIRMED');
    expect(seed.historiesOf(appointment.id)).toHaveLength(0);
  });

  it('acepta cancelar con motivo con menos de 24 horas y conserva el motivo (CA8)', async () => {
    const appointment = addAt(WINDOW_MINUTES - 1);

    const response = await cancel(appointment.id, studentToken, {
      reason: REASON,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.cancellation).toMatchObject({
      cancelledBy: 'STUDENT',
      reason: REASON,
    });
  });

  it('acepta un motivo de 300 caracteres (CA9)', async () => {
    const appointment = addAt(48 * 60);

    const response = await cancel(appointment.id, studentToken, {
      reason: LONG_REASON,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.cancellation.reason).toBe(LONG_REASON);
  });

  it('rechaza un motivo de 301 caracteres (CA4)', async () => {
    const appointment = addAt(48 * 60);

    const response = await cancel(appointment.id, studentToken, {
      reason: TOO_LONG_REASON,
    });

    expect(response.status).toBe(400);

    const detail = await getDetail(appointment.id);
    expect(detail.body.data.status).toBe('CONFIRMED');
    expect(seed.historiesOf(appointment.id)).toHaveLength(0);
  });

  it('cancela el mentor, guarda el historial y no libera el bloque (CA3, CA14)', async () => {
    const block = target();
    const appointment = addOnBlock(block);

    const response = await cancel(appointment.id, mentorToken, {
      reason: REASON,
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      status: 'CANCELLED',
      cancellation: {
        cancelledBy: 'MENTOR',
        cancelledByMe: true,
        reason: REASON,
        cancelledAt: OVERLAP_HTTP_ANCHOR.toISOString(),
      },
    });
    expect(seed.historiesOf(appointment.id)).toEqual([
      {
        appointmentId: appointment.id,
        previousStatusId: seed.statusIdOf(AppointmentStatusTitle.CONFIRMED),
        newStatusId: seed.statusIdOf(AppointmentStatusTitle.CANCELLED),
        changedById: mentorId,
      },
    ]);

    const detail = await getDetail(appointment.id, studentToken);
    expect(detail.body.data.cancellation).toMatchObject({
      cancelledBy: 'MENTOR',
      cancelledByMe: false,
      reason: REASON,
    });

    const blocks = await freeBlocks(block.mentorId);
    expect(blocks.some((item) => item.id === block.id)).toBe(false);

    const booking = await post(block.id);
    expect(booking.status).toBe(409);
    expect(booking.body).toMatchObject({
      statusCode: 409,
      ok: false,
      code: APPOINTMENT_ERROR_CODES.slotUnavailable,
      data: null,
    });
  });

  it('no genera una segunda cancelación ni un segundo historial (CA12)', async () => {
    const appointment = addAt(48 * 60);

    const first = await cancel(appointment.id, studentToken, {
      reason: REASON,
    });
    const second = await cancel(appointment.id, studentToken, {
      reason: 'Otro motivo',
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.data.cancellation).toEqual(
      first.body.data.cancellation,
    );
    expect(seed.historiesOf(appointment.id)).toHaveLength(1);
  });

  it('rechaza a un usuario ajeno sin modificar la cita', async () => {
    const appointment = addAt(48 * 60);

    const response = await cancel(appointment.id, outsiderToken, {
      reason: REASON,
    });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      statusCode: 403,
      ok: false,
      code: APPOINTMENT_ERROR_CODES.appointmentNotOwned,
      data: null,
    });

    const detail = await getDetail(appointment.id);
    expect(detail.body.data.status).toBe('CONFIRMED');
    expect(seed.historiesOf(appointment.id)).toHaveLength(0);
  });

  it('responde 404 si la cita no existe', async () => {
    const response = await cancel(randomUUID());

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      ok: false,
      code: APPOINTMENT_ERROR_CODES.appointmentNotFound,
      data: null,
    });
  });

  it('rechaza una cita que ya empezó sin modificar el estado', async () => {
    const appointment = addAt(-1);

    const response = await cancel(appointment.id, studentToken, {
      reason: REASON,
    });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      statusCode: 409,
      ok: false,
      code: APPOINTMENT_ERROR_CODES.appointmentNotCancellable,
      data: null,
    });

    const detail = await getDetail(appointment.id);
    expect(detail.body.data.status).toBe('CONFIRMED');
    expect(seed.historiesOf(appointment.id)).toHaveLength(0);
  });

  it('rechaza una cita que no está confirmada sin modificar el estado', async () => {
    const appointment = addAt(48 * 60, AppointmentStatusTitle.COMPLETED);

    const response = await cancel(appointment.id, studentToken, {
      reason: REASON,
    });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      statusCode: 409,
      ok: false,
      code: APPOINTMENT_ERROR_CODES.appointmentNotCancellable,
      data: null,
    });

    const detail = await getDetail(appointment.id);
    expect(detail.body.data.status).toBe('COMPLETED');
    expect(seed.historiesOf(appointment.id)).toHaveLength(0);
  });

  it('devuelve una cita ya cancelada sin exigir motivo', async () => {
    const cancelledAt = minutesFromAnchor(-30);
    const appointment = seed.addAppointment({
      mentorId,
      studentId,
      startAt: minutesFromAnchor(60),
      endAt: minutesFromAnchor(90),
      status: AppointmentStatusTitle.CANCELLED,
      cancellation: {
        cancelledById: mentorId,
        cancellationReason: REASON,
        cancelledAt,
      },
    });

    const response = await cancel(appointment.id, studentToken);

    expect(response.status).toBe(200);
    expect(response.body.data.cancellation).toMatchObject({
      cancelledBy: 'MENTOR',
      cancelledByMe: false,
      reason: REASON,
      cancelledAt: cancelledAt.toISOString(),
    });
    expect(seed.historiesOf(appointment.id)).toHaveLength(0);
  });
});
