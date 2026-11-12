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
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import type { AppointmentRecord } from '../types/appointment-record.types.js';
import {
  InMemoryOverlapSeed,
  OVERLAP_HTTP_ANCHOR,
} from './fixtures/overlap-http-seed.fixture.js';

const JWT_SECRET = 'appointments-completed-status-http-secret';
const MINUTE = 60 * 1000;
const PAGE_SIZE = 50;

const jwt = new JwtService({ secret: JWT_SECRET });

const minutesFromAnchor = (minutes: number) =>
  new Date(OVERLAP_HTTP_ANCHOR.getTime() + minutes * MINUTE);

interface AppointmentRow {
  id: string;
  status: string;
}

describe('Estado «Completada» de las citas (integración HTTP)', () => {
  let app: INestApplication;
  let seed: InMemoryOverlapSeed;
  let mentorToken: string;
  let studentToken: string;

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    vi.setSystemTime(OVERLAP_HTTP_ANCHOR);
    seed = new InMemoryOverlapSeed();
    mentorToken = jwt.sign({ sub: seed.mentorIdAt(2), roleTag: 'mentor' });
    studentToken = jwt.sign({ sub: seed.studentId, roleTag: 'estudiante' });

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

  const addAppointment = (
    startMinute: number,
    endMinute: number,
    status: AppointmentStatusTitle = AppointmentStatusTitle.CONFIRMED,
  ): AppointmentRecord =>
    seed.addAppointment({
      mentorId: seed.mentorIdAt(2),
      studentId: seed.studentId,
      startAt: minutesFromAnchor(startMinute),
      endAt: minutesFromAnchor(endMinute),
      status,
    });

  const listMine = async (
    token: string,
    scope: 'upcoming' | 'past',
  ): Promise<AppointmentRow[]> => {
    const response = await request(app.getHttpServer())
      .get('/appointments/me')
      .query({ scope, page: 1, pageSize: PAGE_SIZE })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    return response.body.data.items as AppointmentRow[];
  };

  const findIn = (rows: AppointmentRow[], id: string) =>
    rows.find((row) => row.id === id);

  const detailStatus = async (token: string, id: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .get(`/appointments/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    return response.body.data.status as string;
  };

  const viewers = (): Array<[string, string]> => [
    ['el mentor', mentorToken],
    ['el titulado', studentToken],
  ];

  it('muestra en «Pasadas» como COMPLETED una cita confirmada que ya terminó, para ambos participantes (CA1)', async () => {
    const ended = addAppointment(-90, -60);

    for (const [, token] of viewers()) {
      const past = await listMine(token, 'past');
      const upcoming = await listMine(token, 'upcoming');

      expect(findIn(past, ended.id)?.status).toBe('COMPLETED');
      expect(findIn(upcoming, ended.id)).toBeUndefined();
      await expect(detailStatus(token, ended.id)).resolves.toBe('COMPLETED');
    }
  });

  it('mantiene CONFIRMED en «Próximas» una cita en curso, para ambos participantes (CA2)', async () => {
    const inProgress = addAppointment(-10, 20);

    for (const [, token] of viewers()) {
      const upcoming = await listMine(token, 'upcoming');
      const past = await listMine(token, 'past');

      expect(findIn(upcoming, inProgress.id)?.status).toBe('CONFIRMED');
      expect(findIn(past, inProgress.id)).toBeUndefined();
      await expect(detailStatus(token, inProgress.id)).resolves.toBe(
        'CONFIRMED',
      );
    }
  });

  it('pasa a COMPLETED en el minuto exacto de fin y no un milisegundo antes (CA11)', async () => {
    const appointment = addAppointment(-30, 0);

    vi.setSystemTime(new Date(OVERLAP_HTTP_ANCHOR.getTime() - 1));
    for (const [, token] of viewers()) {
      expect(findIn(await listMine(token, 'upcoming'), appointment.id)).toEqual(
        expect.objectContaining({ status: 'CONFIRMED' }),
      );
      await expect(detailStatus(token, appointment.id)).resolves.toBe(
        'CONFIRMED',
      );
    }

    vi.setSystemTime(OVERLAP_HTTP_ANCHOR);
    for (const [, token] of viewers()) {
      expect(
        findIn(await listMine(token, 'upcoming'), appointment.id),
      ).toBeUndefined();
      expect(findIn(await listMine(token, 'past'), appointment.id)).toEqual(
        expect.objectContaining({ status: 'COMPLETED' }),
      );
      await expect(detailStatus(token, appointment.id)).resolves.toBe(
        'COMPLETED',
      );
    }
  });

  it('conserva CANCELLED en una cita cancelada cuya hora ya pasó (CA3)', async () => {
    const cancelled = addAppointment(
      -90,
      -60,
      AppointmentStatusTitle.CANCELLED,
    );

    for (const [, token] of viewers()) {
      await expect(detailStatus(token, cancelled.id)).resolves.toBe(
        'CANCELLED',
      );
      const listed = [
        ...(await listMine(token, 'upcoming')),
        ...(await listMine(token, 'past')),
      ].filter((row) => row.id === cancelled.id);
      expect(listed.every((row) => row.status === 'CANCELLED')).toBe(true);
    }
  });

  it('muestra COMPLETED en «Pasadas» para las citas completadas del seed', async () => {
    const past = await listMine(studentToken, 'past');
    const statuses = new Set(past.map((row) => row.status));

    expect(past.length).toBeGreaterThan(0);
    expect(statuses.has('COMPLETED')).toBe(true);
    expect(statuses.has('COMPLETADA')).toBe(false);
    expect(statuses.has('CONFIRMED')).toBe(false);
  });
});
