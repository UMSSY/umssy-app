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
import type { AppointmentRecord } from '../types/appointment-record.types.js';
import type { MyAppointmentResponse } from '../types/my-appointment-response.types.js';
import {
  InMemoryOverlapSeed,
  OVERLAP_HTTP_ANCHOR,
} from './fixtures/overlap-http-seed.fixture.js';

const JWT_SECRET = 'appointments-cancelled-http-secret';
const MINUTE = 60 * 1000;
const PAGE_SIZE = 50;
const REASON = 'Me surgió una reunión de trabajo';

const jwt = new JwtService({ secret: JWT_SECRET });

const minutesFromAnchor = (minutes: number) =>
  new Date(OVERLAP_HTTP_ANCHOR.getTime() + minutes * MINUTE);

describe('Cita cancelada en «Mis citas» (integración HTTP)', () => {
  let app: INestApplication;
  let seed: InMemoryOverlapSeed;
  let mentorId: string;
  let studentId: string;

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: OVERLAP_HTTP_ANCHOR });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    seed = new InMemoryOverlapSeed();
    mentorId = seed.mentorIdAt(2);
    studentId = seed.studentId;

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

  const tokenOf = (userId: string, roleTag = 'estudiante') =>
    jwt.sign({ sub: userId, roleTag });

  const addCancelled = (
    cancelledById: string,
    cancellationReason: string | null,
    startMinute = 24 * 60,
  ): AppointmentRecord =>
    seed.addAppointment({
      mentorId,
      studentId,
      startAt: minutesFromAnchor(startMinute),
      endAt: minutesFromAnchor(startMinute + 30),
      status: AppointmentStatusTitle.CANCELLED,
      cancellation: {
        cancelledById,
        cancellationReason,
        cancelledAt: minutesFromAnchor(-60),
      },
    });

  const listMine = async (
    userId: string,
    scope: 'upcoming' | 'past',
  ): Promise<MyAppointmentResponse[]> => {
    const response = await request(app.getHttpServer())
      .get('/appointments/me')
      .query({ scope, page: 1, pageSize: PAGE_SIZE })
      .set('Authorization', `Bearer ${tokenOf(userId)}`);

    expect(response.status).toBe(200);
    return response.body.data.items as MyAppointmentResponse[];
  };

  const getDetail = (userId: string, id: string) =>
    request(app.getHttpServer())
      .get(`/appointments/${id}`)
      .set('Authorization', `Bearer ${tokenOf(userId)}`);

  const viewsOf = async (
    userId: string,
    appointment: AppointmentRecord,
    scope: 'upcoming' | 'past' = 'upcoming',
  ) => {
    const card = (await listMine(userId, scope)).find(
      (row) => row.id === appointment.id,
    );
    const detail = await getDetail(userId, appointment.id);
    expect(detail.status).toBe(200);
    return { card, detail: detail.body.data as MyAppointmentResponse };
  };

  describe.each([
    ['el mentor', () => mentorId, 'MENTOR'],
    ['el titulado', () => studentId, 'STUDENT'],
  ] as const)('cancelada por %s', (_who, cancellerOf, cancelledBy) => {
    it.each([
      ['con motivo', REASON, REASON],
      ['sin motivo', null, null],
      ['con un motivo de solo espacios', '   ', null],
    ])(
      '%s: ambos participantes ven el mismo estado, quién canceló y el motivo (CA1, CA6)',
      async (_case, storedReason, expectedReason) => {
        const canceller = cancellerOf();
        const appointment = addCancelled(canceller, storedReason);

        for (const viewer of [mentorId, studentId]) {
          const { card, detail } = await viewsOf(viewer, appointment);
          const expected = {
            status: 'CANCELLED',
            cancellation: {
              cancelledBy,
              cancelledByMe: viewer === canceller,
              reason: expectedReason,
              cancelledAt: minutesFromAnchor(-60).toISOString(),
            },
          };

          expect(card).toMatchObject(expected);
          expect(detail).toMatchObject(expected);
        }
      },
    );
  });

  it('indica al mentor que él realizó la cancelación (CA10)', async () => {
    const appointment = addCancelled(mentorId, REASON);

    const { card, detail } = await viewsOf(mentorId, appointment);

    expect(card?.cancellation?.cancelledByMe).toBe(true);
    expect(detail.cancellation?.cancelledByMe).toBe(true);
  });

  it('indica al titulado que él realizó la cancelación (CA11)', async () => {
    const appointment = addCancelled(studentId, null);

    const { card, detail } = await viewsOf(studentId, appointment);

    expect(card?.cancellation?.cancelledByMe).toBe(true);
    expect(detail.cancellation?.cancelledByMe).toBe(true);
  });

  it('muestra en «Pasadas» una cita cancelada cuya hora ya pasó', async () => {
    const appointment = addCancelled(mentorId, REASON, -120);

    const { card, detail } = await viewsOf(studentId, appointment, 'past');

    expect(card).toMatchObject({ status: 'CANCELLED' });
    expect(detail.cancellation).toMatchObject({ cancelledBy: 'MENTOR' });
    expect(
      (await listMine(studentId, 'upcoming')).some(
        (row) => row.id === appointment.id,
      ),
    ).toBe(false);
  });

  it('deja la cancelación en null en una cita confirmada', async () => {
    const appointment = seed.addAppointment({
      mentorId,
      studentId,
      startAt: minutesFromAnchor(24 * 60),
      endAt: minutesFromAnchor(24 * 60 + 30),
      status: AppointmentStatusTitle.CONFIRMED,
    });

    const { card, detail } = await viewsOf(studentId, appointment);

    expect(card?.cancellation).toBeNull();
    expect(detail.cancellation).toBeNull();
  });

  it('niega el detalle a un usuario ajeno sin revelar datos de la cita (CA13)', async () => {
    const appointment = addCancelled(mentorId, REASON);

    const response = await getDetail(seed.mentorIdAt(3), appointment.id);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      statusCode: 403,
      ok: false,
      code: APPOINTMENT_ERROR_CODES.appointmentNotOwned,
      data: null,
    });
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain(REASON);
    expect(serialized).not.toContain(seed.nameOf(mentorId));
    expect(serialized).not.toContain(seed.nameOf(studentId));
  });

  it('no lista la cita cancelada a un usuario ajeno', async () => {
    const appointment = addCancelled(mentorId, REASON);
    const outsider = seed.mentorIdAt(3);

    const rows = [
      ...(await listMine(outsider, 'upcoming')),
      ...(await listMine(outsider, 'past')),
    ];

    expect(rows.some((row) => row.id === appointment.id)).toBe(false);
  });

  it.each([
    [0, 'STUDENT', 'Imprevisto ficticio del titulado; pedirá otro horario.'],
    [1, 'MENTOR', null],
  ] as const)(
    'devuelve la cancelación de la cita cancelada del seed del mentor %i',
    async (mentorIndex, cancelledBy, reason) => {
      const seededMentor = seed.mentorIdAt(mentorIndex);

      const cancelled = (await listMine(seededMentor, 'past')).filter(
        (row) => row.status === 'CANCELLED',
      );

      expect(cancelled.length).toBeGreaterThan(0);
      expect(cancelled[0].cancellation).toMatchObject({
        cancelledBy,
        cancelledByMe: cancelledBy === 'MENTOR',
        reason,
      });
    },
  );
});
