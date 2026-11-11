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
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { AvailabilityRepository } from '../../availability/repositories/availability.repository.js';
import { BlockedDatesService } from '../../availability/services/blocked-dates.service.js';
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

const OVERLAP_MESSAGE =
  'Ya tienes una cita en ese horario. Elige otro horario.';
const JWT_SECRET = 'appointments-overlap-http-secret';
const MINUTE = 60 * 1000;
const SLOT_MINUTES = 30;

const jwt = new JwtService({ secret: JWT_SECRET });

describe('POST /appointments (integración HTTP de cruces)', () => {
  let app: INestApplication;
  let seed: InMemoryOverlapSeed;
  let studentToken: string;
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
    dualMentorToken = jwt.sign({
      sub: seed.dualMentorId,
      roleTag: 'mentor',
    });

    const moduleRef = await Test.createTestingModule({
      imports: [AppointmentsModule],
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
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const post = (blockId: string, token = studentToken) =>
    request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        blockId,
        orientationTypeId: OVERLAP_TOPIC.id,
        message: 'Quiero reforzar mis bases',
      });

  const target = (): InMemoryBlock => seed.blockFor(1, 6);

  const addExisting = (
    startAt: Date,
    endAt: Date,
    status: AppointmentStatusTitle = AppointmentStatusTitle.CONFIRMED,
    mentorId: string = seed.mentorIdAt(2),
  ) =>
    seed.addAppointment({
      mentorId,
      studentId: seed.studentId,
      startAt,
      endAt,
      status,
    });

  const countStudentAppointments = () =>
    seed.countAppointmentsOf(seed.studentId);

  describe('cruces con una cita confirmada', () => {
    const overlapCases: Array<[string, number, number]> = [
      ['ocupa exactamente el mismo horario (CA5)', 0, SLOT_MINUTES],
      ['empieza antes y termina dentro (CA6)', -15, 15],
      ['empieza dentro y termina después (CA7)', 15, SLOT_MINUTES + 15],
      ['contiene por completo a la existente (CA8)', -15, SLOT_MINUTES + 15],
    ];

    it.each(overlapCases)(
      'responde 409 cuando la cita existente %s',
      async (_case, fromStart, toStart) => {
        const block = target();
        addExisting(
          new Date(block.startAt.getTime() + fromStart * MINUTE),
          new Date(block.startAt.getTime() + toStart * MINUTE),
        );
        const before = countStudentAppointments();

        const response = await post(block.id);

        expect(response.status).toBe(409);
        expect(response.body).toMatchObject({
          statusCode: 409,
          ok: false,
          code: APPOINTMENT_ERROR_CODES.appointmentOverlap,
          detail: OVERLAP_MESSAGE,
        });
        expect(countStudentAppointments()).toBe(before);
      },
    );

    it('rechaza el cruce aunque la cita existente sea con otro mentor (CA1)', async () => {
      const block = target();
      const existing = addExisting(block.startAt, block.endAt);
      const before = countStudentAppointments();

      const response = await post(block.id);

      expect(response.status).toBe(409);
      expect(existing.blockId).not.toBe(block.id);
      expect(response.body.code).toBe(
        APPOINTMENT_ERROR_CODES.appointmentOverlap,
      );
      expect(countStudentAppointments()).toBe(before);
    });

    it('no revela datos de la otra cita en el error (CA13)', async () => {
      const block = target();
      addExisting(block.startAt, block.endAt);

      const response = await post(block.id);

      expect(Object.keys(response.body).sort()).toEqual([
        'code',
        'data',
        'detail',
        'ok',
        'statusCode',
      ]);
      expect(response.body.data).toBeNull();
      expect(response.body.detail).toBe(OVERLAP_MESSAGE);
      const serialized = JSON.stringify(response.body);
      expect(serialized).not.toContain(seed.nameOf(seed.mentorIdAt(2)));
      expect(serialized).not.toContain('@umssy.test');
      expect(serialized).not.toContain(OVERLAP_TOPIC.name);
    });
  });

  describe('límites permitidos', () => {
    it('permite una cita que empieza cuando termina la existente (CA3)', async () => {
      const block = target();
      addExisting(
        new Date(block.startAt.getTime() - SLOT_MINUTES * MINUTE),
        block.startAt,
      );
      const before = countStudentAppointments();

      const response = await post(block.id);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ statusCode: 201, ok: true });
      expect(response.body.data).toMatchObject({
        blockId: block.id,
        status: AppointmentStatusTitle.CONFIRMED,
      });
      expect(countStudentAppointments()).toBe(before + 1);
    });

    it('permite una cita que termina cuando empieza la existente (CA9)', async () => {
      const block = target();
      addExisting(
        block.endAt,
        new Date(block.endAt.getTime() + SLOT_MINUTES * MINUTE),
      );

      const response = await post(block.id);

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({ blockId: block.id });
    });
  });

  describe('estados que no cuentan como conflicto', () => {
    const ignoredStatuses: Array<[string, AppointmentStatusTitle]> = [
      ['cancelada (CA10)', AppointmentStatusTitle.CANCELLED],
      ['completada (CA11)', AppointmentStatusTitle.COMPLETED],
    ];

    it.each(ignoredStatuses)(
      'permite reservar sobre una cita %s',
      async (_case, status) => {
        const block = target();
        addExisting(block.startAt, block.endAt, status);

        const response = await post(block.id);

        expect(response.status).toBe(201);
      },
    );
  });

  describe('mentor que reserva con otro mentor', () => {
    it('rechaza el cruce cuando ya tiene una cita confirmada como mentor (CA2)', async () => {
      const block = target();
      seed.addAppointment({
        mentorId: seed.dualMentorId,
        studentId: seed.mentorIdAt(3),
        startAt: block.startAt,
        endAt: block.endAt,
        status: AppointmentStatusTitle.CONFIRMED,
      });

      const response = await post(block.id, dualMentorToken);

      expect(response.status).toBe(409);
      expect(response.body.code).toBe(
        APPOINTMENT_ERROR_CODES.appointmentOverlap,
      );
    });

    it('permite reservar con otro mentor en un horario libre (CA2)', async () => {
      const block = seed.blockFor(1, 8);
      seed.addAppointment({
        mentorId: seed.dualMentorId,
        studentId: seed.mentorIdAt(3),
        startAt: target().startAt,
        endAt: target().endAt,
        status: AppointmentStatusTitle.CONFIRMED,
      });

      const response = await post(block.id, dualMentorToken);

      expect(response.status).toBe(201);
    });
  });

  describe('reservas simultáneas', () => {
    it('rechaza la segunda reserva secuencial del mismo horario (CA12)', async () => {
      const block = target();
      const otherBlock = seed.addBlock(
        seed.mentorIdAt(3),
        block.startAt,
        block.endAt,
      );

      const first = await post(block.id);
      const second = await post(otherBlock.id);

      expect(first.status).toBe(201);
      expect(second.status).toBe(409);
      expect(second.body.code).toBe(
        APPOINTMENT_ERROR_CODES.appointmentOverlap,
      );
    });

    it('confirma como máximo una de dos reservas cruzadas simultáneas (CA4/CA12)', async () => {
      const block = target();
      const firstBlock = seed.addBlock(
        seed.mentorIdAt(3),
        block.startAt,
        block.endAt,
      );
      const secondBlock = seed.addBlock(
        seed.mentorIdAt(4),
        block.startAt,
        block.endAt,
      );
      const before = countStudentAppointments();

      const responses = await Promise.all([
        post(firstBlock.id),
        post(secondBlock.id),
      ]);

      expect(
        responses.map((response) => response.status).sort((a, b) => a - b),
      ).toEqual([201, 409]);
      const rejected = responses.find((response) => response.status === 409);
      expect(rejected?.body.code).toBe(
        APPOINTMENT_ERROR_CODES.appointmentOverlap,
      );
      expect(countStudentAppointments()).toBe(before + 1);
    });
  });
});
