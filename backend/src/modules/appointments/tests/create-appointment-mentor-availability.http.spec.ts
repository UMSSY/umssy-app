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
import { SessionRepository } from '../../../common/repositories/session.repository.js';
import { toBoliviaTime } from '../../../common/utils/date-time.js';
import { AvailabilityModule } from '../../availability/availability.module.js';
import { AvailabilityRepository } from '../../availability/repositories/availability.repository.js';
import { BlockedDatesRepository } from '../../availability/repositories/blocked-dates.repository.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { AppointmentsModule } from '../appointments.module.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import {
  InMemoryOverlapSeed,
  OVERLAP_HTTP_ANCHOR,
  OVERLAP_TOPIC,
  type InMemoryBlock,
} from './fixtures/overlap-http-seed.fixture.js';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const JWT_SECRET = 'appointments-mentor-availability-http-secret';
const MENTOR_UNAVAILABLE_MESSAGE =
  'El mentor no está disponible para recibir citas';
const SLOT_UNAVAILABLE_MESSAGE = 'Este horario ya no está disponible';

const jwt = new JwtService({ secret: JWT_SECRET });

describe('POST /appointments (integración HTTP de disponibilidad del mentor)', () => {
  let app: INestApplication;
  let seed: InMemoryOverlapSeed;
  let studentToken: string;
  let seededStudentToken: string;
  let mentorToken: string;
  let dualMentorToken: string;

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: OVERLAP_HTTP_ANCHOR });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    seed = new InMemoryOverlapSeed();
    studentToken = jwt.sign({ sub: seed.studentId, roleTag: 'estudiante' });
    seededStudentToken = jwt.sign({
      sub: seed.userIdAt(1),
      roleTag: 'estudiante',
    });
    mentorToken = jwt.sign({ sub: seed.mentorIdAt(1), roleTag: 'mentor' });
    dualMentorToken = jwt.sign({
      sub: seed.dualMentorId,
      roleTag: 'mentor',
    });

    const moduleRef = await Test.createTestingModule({
      imports: [AppointmentsModule, AvailabilityModule],
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
      .overrideProvider(BlockedDatesRepository)
      .useValue(seed.blockedDatesRepository)
      .overrideProvider(AppointmentsRepository)
      .useValue(seed.appointmentsRepository)
      .overrideProvider(MentorsService)
      .useValue(seed.mentorsService)
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const mentorId = (): string => seed.mentorIdAt(1);

  const target = (): InMemoryBlock => seed.blockFor(1, 6);

  const otherDayBlock = (): InMemoryBlock => seed.blockFor(1, 7);

  const postAppointment = (blockId: string, token = studentToken) =>
    request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        blockId,
        orientationTypeId: OVERLAP_TOPIC.id,
        message: 'Quiero reforzar mis bases',
      });

  const setAvailability = (
    isAvailable: boolean,
    token = mentorToken,
    id = mentorId(),
  ) =>
    request(app.getHttpServer())
      .patch(`/mentors/${id}/availability`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isAvailable });

  const blockDay = (block: InMemoryBlock, token = mentorToken) =>
    request(app.getHttpServer())
      .post('/blocked-dates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        blockedOn: toBoliviaTime(block.startAt).date,
        reason: 'Fecha bloqueada por el mentor',
      });

  const deleteBlock = (blockId: string, token = mentorToken) =>
    request(app.getHttpServer())
      .delete(`/availability-blocks/${blockId}`)
      .set('Authorization', `Bearer ${token}`);

  const freeBlocks = (block: InMemoryBlock, token = studentToken) => {
    const from = new Date(block.startAt.getTime() - HOUR).toISOString();
    const to = new Date(block.startAt.getTime() + 2 * DAY).toISOString();
    return request(app.getHttpServer())
      .get(`/mentors/${mentorId()}/free-blocks`)
      .query({ from, to })
      .set('Authorization', `Bearer ${token}`);
  };

  const myAppointments = (token = seededStudentToken) =>
    request(app.getHttpServer())
      .get('/appointments/me')
      .set('Authorization', `Bearer ${token}`);

  const appointmentDetail = (appointmentId: string, token: string) =>
    request(app.getHttpServer())
      .get(`/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${token}`);

  const countStudentAppointments = () =>
    seed.countAppointmentsOf(seed.studentId);

  it('CA1: rechaza la reserva cuando el mentor está en pausa antes de abrir el formulario', async () => {
    const block = target();
    const before = countStudentAppointments();

    const paused = await setAvailability(false);

    expect(paused.status).toBe(200);
    expect(paused.body.data).toMatchObject({
      mentorId: mentorId(),
      isAvailable: false,
    });

    const response = await postAppointment(block.id);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      statusCode: 403,
      ok: false,
      code: APPOINTMENT_ERROR_CODES.mentorUnavailable,
      detail: MENTOR_UNAVAILABLE_MESSAGE,
      data: null,
    });
    expect(countStudentAppointments()).toBe(before);
  });

  it('CA2: rechaza la reserva cuando el mentor bloqueó la fecha antes de abrir el formulario', async () => {
    const block = target();
    const before = countStudentAppointments();

    const blocked = await blockDay(block);

    expect(blocked.status).toBe(201);

    const form = await freeBlocks(block);

    expect(form.status).toBe(200);
    expect(form.body.data.map((item: { id: string }) => item.id)).not.toContain(
      block.id,
    );

    const response = await postAppointment(block.id);

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      statusCode: 409,
      ok: false,
      code: APPOINTMENT_ERROR_CODES.slotUnavailable,
      detail: SLOT_UNAVAILABLE_MESSAGE,
      data: null,
    });
    expect(countStudentAppointments()).toBe(before);
  });

  it('CA3: permite reservar cuando el mentor reactiva su disponibilidad', async () => {
    const block = target();
    const before = countStudentAppointments();

    expect((await setAvailability(false)).status).toBe(200);

    const reactivated = await setAvailability(true);

    expect(reactivated.status).toBe(200);
    expect(reactivated.body.data).toMatchObject({
      mentorId: mentorId(),
      isAvailable: true,
    });

    const form = await freeBlocks(block);

    expect(form.status).toBe(200);
    expect(form.body.data.map((item: { id: string }) => item.id)).toContain(
      block.id,
    );

    const response = await postAppointment(block.id);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      blockId: block.id,
      status: 'CONFIRMED',
    });
    expect(countStudentAppointments()).toBe(before + 1);
  });

  it('CA3: mantiene bloqueadas las fechas del mentor al reactivarse', async () => {
    const block = target();
    const blockedBlock = otherDayBlock();

    expect((await setAvailability(false)).status).toBe(200);
    expect((await blockDay(blockedBlock)).status).toBe(201);
    expect((await setAvailability(true)).status).toBe(200);

    const form = await freeBlocks(block);
    const ids = form.body.data.map((item: { id: string }) => item.id);

    expect(form.status).toBe(200);
    expect(ids).toContain(block.id);
    expect(ids).not.toContain(blockedBlock.id);
  });

  it('CA4: mantiene visibles las citas confirmadas cuando el mentor pausa su disponibilidad', async () => {
    const appointment = seed.seededAppointmentFor(1);

    const before = await myAppointments();

    expect(before.status).toBe(200);
    expect(before.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: appointment.id,
          status: 'CONFIRMED',
        }),
      ]),
    );

    expect((await setAvailability(false)).status).toBe(200);

    const after = await myAppointments();

    expect(after.status).toBe(200);
    expect(after.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: appointment.id,
          status: 'CONFIRMED',
        }),
      ]),
    );
  });

  it('CA6: rechaza si el mentor pausa su disponibilidad después de abrir el formulario', async () => {
    const block = target();
    const before = countStudentAppointments();

    const form = await freeBlocks(block);

    expect(form.status).toBe(200);
    expect(form.body.data.map((item: { id: string }) => item.id)).toContain(
      block.id,
    );
    expect((await setAvailability(false)).status).toBe(200);

    const response = await postAppointment(block.id);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      statusCode: 403,
      ok: false,
      code: APPOINTMENT_ERROR_CODES.mentorUnavailable,
      detail: MENTOR_UNAVAILABLE_MESSAGE,
      data: null,
    });
    expect(countStudentAppointments()).toBe(before);
  });

  it('CA7: rechaza si el mentor bloquea la fecha después de abrir el formulario', async () => {
    const block = target();
    const before = countStudentAppointments();

    const form = await freeBlocks(block);

    expect(form.status).toBe(200);
    expect(form.body.data.map((item: { id: string }) => item.id)).toContain(
      block.id,
    );
    expect((await blockDay(block)).status).toBe(201);

    const response = await postAppointment(block.id);

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      statusCode: 409,
      ok: false,
      code: APPOINTMENT_ERROR_CODES.slotUnavailable,
      detail: SLOT_UNAVAILABLE_MESSAGE,
      data: null,
    });
    expect(countStudentAppointments()).toBe(before);
  });

  it('CA8: rechaza si el mentor elimina el bloque después de abrir el formulario', async () => {
    const block = target();
    const before = countStudentAppointments();

    const form = await freeBlocks(block);

    expect(form.status).toBe(200);
    expect(form.body.data.map((item: { id: string }) => item.id)).toContain(
      block.id,
    );
    expect((await deleteBlock(block.id)).status).toBe(200);

    const response = await postAppointment(block.id);

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      statusCode: 409,
      ok: false,
      code: APPOINTMENT_ERROR_CODES.slotUnavailable,
      detail: SLOT_UNAVAILABLE_MESSAGE,
      data: null,
    });
    expect(countStudentAppointments()).toBe(before);
  });

  it('CA12: mantiene visible y confirmada una cita cuando el mentor pausa su disponibilidad', async () => {
    const appointment = seed.seededAppointmentFor(1);

    const before = await appointmentDetail(appointment.id, seededStudentToken);

    expect(before.status).toBe(200);
    expect(before.body.data).toMatchObject({
      id: appointment.id,
      status: 'CONFIRMED',
    });

    expect((await setAvailability(false)).status).toBe(200);

    const after = await appointmentDetail(appointment.id, seededStudentToken);

    expect(after.status).toBe(200);
    expect(after.body.data).toMatchObject({
      id: appointment.id,
      status: before.body.data.status,
      startAt: before.body.data.startAt,
      endAt: before.body.data.endAt,
    });
  });

  it('permite que un mentor en pausa reserve con otro mentor', async () => {
    const block = seed.blockFor(1, 8);
    const before = seed.countAppointmentsOf(seed.dualMentorId);

    expect(
      (await setAvailability(false, dualMentorToken, seed.dualMentorId)).status,
    ).toBe(200);

    const response = await postAppointment(block.id, dualMentorToken);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      blockId: block.id,
      status: 'CONFIRMED',
    });
    expect(seed.countAppointmentsOf(seed.dualMentorId)).toBe(before + 1);
  });
});
