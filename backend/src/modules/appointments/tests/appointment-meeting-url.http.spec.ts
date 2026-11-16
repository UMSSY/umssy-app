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
import { AvailabilityModule } from '../../availability/availability.module.js';
import { AvailabilityRepository } from '../../availability/repositories/availability.repository.js';
import { BlockedDatesRepository } from '../../availability/repositories/blocked-dates.repository.js';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { AppointmentsModule } from '../appointments.module.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';
import {
  MEETING_BASE_URL,
  MEETING_ROOM_PREFIX,
} from '../constants/meeting-url.constants.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import {
  InMemoryOverlapSeed,
  OVERLAP_HTTP_ANCHOR,
  OVERLAP_TOPIC,
  type InMemoryBlock,
} from './fixtures/overlap-http-seed.fixture.js';

const JWT_SECRET = 'appointments-meeting-url-http-secret';
const STORED_MEETING_URL =
  'https://meet.jit.si/umssy-11111111-1111-4111-8111-111111111111';
const MEETING_URL_PATTERN = new RegExp(
  `^${MEETING_BASE_URL.replaceAll('.', '\\.')}/${MEETING_ROOM_PREFIX}[0-9a-f-]{36}$`,
);

const jwt = new JwtService({ secret: JWT_SECRET });

describe('GET /appointments/:id (integración HTTP del enlace de la reunión)', () => {
  let app: INestApplication;
  let seed: InMemoryOverlapSeed;

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: OVERLAP_HTTP_ANCHOR });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    seed = new InMemoryOverlapSeed();

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

  const tokenFor = (userId: string, roleTag: string): string =>
    jwt.sign({ sub: userId, roleTag });

  const target = (): InMemoryBlock => seed.blockFor(1, 6);

  const postAppointment = (blockId: string, token: string) =>
    request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        blockId,
        orientationTypeId: OVERLAP_TOPIC.id,
        message: 'Quiero reforzar mis bases',
      });

  const appointmentDetail = (appointmentId: string, token: string) =>
    request(app.getHttpServer())
      .get(`/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${token}`);

  it('guarda el enlace al crear la cita y lo devuelve en el detalle', async () => {
    const block = target();
    const studentToken = tokenFor(seed.studentId, 'estudiante');

    const created = await postAppointment(block.id, studentToken);

    expect(created.status).toBe(201);
    const appointmentId = created.body.data.id as string;
    const stored = await seed.appointmentsRepository.findById(appointmentId);

    expect(stored?.meetingUrl).toMatch(MEETING_URL_PATTERN);

    const detail = await appointmentDetail(appointmentId, studentToken);

    expect(detail.status).toBe(200);
    expect(detail.body.data.meetingUrl).toBe(stored?.meetingUrl);
  });

  it('CA9: genera y persiste el enlace de una cita confirmada antigua', async () => {
    const appointment = seed.seededAppointmentFor(1);
    appointment.meetingUrl = null;
    const token = tokenFor(appointment.studentId, 'estudiante');

    const first = await appointmentDetail(appointment.id, token);

    expect(first.status).toBe(200);
    expect(first.body.data.meetingUrl).toMatch(MEETING_URL_PATTERN);

    const stored = await seed.appointmentsRepository.findById(appointment.id);

    expect(stored?.meetingUrl).toBe(first.body.data.meetingUrl);

    const second = await appointmentDetail(appointment.id, token);

    expect(second.body.data.meetingUrl).toBe(first.body.data.meetingUrl);
  });

  it('CA7: devuelve el mismo enlace al mentor y al titulado', async () => {
    const appointment = seed.seededAppointmentFor(1);
    appointment.meetingUrl = STORED_MEETING_URL;

    const studentDetail = await appointmentDetail(
      appointment.id,
      tokenFor(appointment.studentId, 'estudiante'),
    );
    const mentorDetail = await appointmentDetail(
      appointment.id,
      tokenFor(appointment.mentorId, 'mentor'),
    );

    expect(studentDetail.status).toBe(200);
    expect(mentorDetail.status).toBe(200);
    expect(studentDetail.body.data.meetingUrl).toBe(STORED_MEETING_URL);
    expect(mentorDetail.body.data.meetingUrl).toBe(
      studentDetail.body.data.meetingUrl,
    );
  });

  it.each([
    ['cancelada', AppointmentStatusTitle.LEGACY_CANCELLED, 'CANCELLED'],
    ['completada', AppointmentStatusTitle.LEGACY_COMPLETED, 'COMPLETED'],
  ] as const)(
    'CA3: no devuelve el enlace de una cita %s',
    async (_case, status, expectedStatus) => {
      const appointment = seed.seededAppointmentFor(1, status);
      appointment.meetingUrl = STORED_MEETING_URL;

      const response = await appointmentDetail(
        appointment.id,
        tokenFor(appointment.studentId, 'estudiante'),
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        id: appointment.id,
        status: expectedStatus,
        meetingUrl: null,
      });
    },
  );

  it('CA4/CA12: responde 403 a un usuario ajeno sin devolver el enlace', async () => {
    const appointment = seed.seededAppointmentFor(1);
    appointment.meetingUrl = STORED_MEETING_URL;

    expect([appointment.mentorId, appointment.studentId]).not.toContain(
      seed.studentId,
    );

    const response = await appointmentDetail(
      appointment.id,
      tokenFor(seed.studentId, 'estudiante'),
    );

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      statusCode: 403,
      ok: false,
      code: APPOINTMENT_ERROR_CODES.appointmentNotOwned,
      data: null,
    });
    expect(appointment.meetingUrl).toBe(STORED_MEETING_URL);
  });
});
