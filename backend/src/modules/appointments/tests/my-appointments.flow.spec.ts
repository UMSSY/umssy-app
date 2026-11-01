import type { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import { performance } from 'node:perf_hooks';
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
import { PERFORMANCE_APPOINTMENTS } from '../../availability/constants/seed-availability.constants.js';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import {
  buildBlockPlan,
  getWeeks,
} from '../../availability/seeds/availability.seed.js';
import type { SeedBlock } from '../../availability/types/seed-block.types.js';
import { AppointmentsModule } from '../appointments.module.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import type { AppointmentRecord } from '../types/appointment-record.types.js';
import type { MyAppointmentResponse } from '../types/my-appointment-response.types.js';
import type { MyAppointmentsQuery } from '../types/my-appointments-query.types.js';

const NOW = new Date('2026-10-22T15:00:00.000Z');
const MENTOR_A = '11111111-1111-4111-8111-111111111111';
const PERFORMANCE_MENTOR = '33333333-3333-4333-8333-333333333333';
const GRADUATE = '44444444-4444-4444-8444-444444444444';
const EMPTY_GRADUATE = '55555555-5555-4555-8555-555555555555';
const MULTI_ROLE = '99999999-9999-4999-8999-999999999999';
const TOPIC = {
  id: '66666666-6666-4666-8666-666666666666',
  name: 'Orientación profesional',
};
const RESPONSE_LIMIT_MS = 3_000;
const DAY_MS = 86_400_000;

const USERS: Record<
  string,
  { firstName: string; lastName: string; roles: string[] }
> = {
  [MENTOR_A]: { firstName: 'Mentor', lastName: 'Alfa', roles: ['mentor'] },
  [PERFORMANCE_MENTOR]: {
    firstName: 'Mentor',
    lastName: 'Beta',
    roles: ['mentor'],
  },
  [GRADUATE]: { firstName: 'Titulado', lastName: 'Uno', roles: ['titulado'] },
  [EMPTY_GRADUATE]: {
    firstName: 'Titulado',
    lastName: 'Dos',
    roles: ['titulado'],
  },
  [MULTI_ROLE]: {
    firstName: 'Titulado',
    lastName: 'Mentor',
    roles: ['titulado', 'mentor'],
  },
};

const plan = buildBlockPlan(getWeeks(NOW), NOW);
const seededAppointments = plan.blocks.filter(
  (block): block is SeedBlock & { appointmentId: string } =>
    block.appointmentId !== undefined,
);
const mentorOf = (block: SeedBlock) =>
  block.mentorKey === 'primary' ? MENTOR_A : PERFORMANCE_MENTOR;
const person = (id: string) => ({
  id,
  firstName: USERS[id].firstName,
  lastName: USERS[id].lastName,
});

function toRecord(
  id: string,
  blockId: string | null,
  mentorId: string,
  startAt: Date,
  endAt: Date,
): AppointmentRecord {
  return {
    id,
    blockId,
    mentorId,
    studentId: GRADUATE,
    startAt,
    endAt,
    mentor: person(mentorId),
    student: person(GRADUATE),
    orientationType: TOPIC,
    status: { title: AppointmentStatusTitle.CONFIRMED },
  };
}

function createStore(): AppointmentRecord[] {
  return seededAppointments.map((block) =>
    toRecord(block.appointmentId, block.id, mentorOf(block), block.start, block.end),
  );
}

const ACTIVE_TITLES: string[] = [
  AppointmentStatusTitle.CONFIRMED,
  AppointmentStatusTitle.LEGACY_CONFIRMED,
];

function createRepository(store: AppointmentRecord[]) {
  return {
    findMine: (
      userId: string,
      scope: MyAppointmentsQuery['scope'],
      now: Date,
    ) => {
      const rows = store.filter(
        (row) =>
          (row.mentorId === userId || row.studentId === userId) &&
          (scope === 'upcoming' ? row.endAt > now : row.endAt <= now) &&
          ACTIVE_TITLES.includes(row.status.title),
      );
      const byId = (first: AppointmentRecord, second: AppointmentRecord) =>
        first.id.localeCompare(second.id);
      rows.sort((first, second) =>
        scope === 'upcoming'
          ? first.startAt.getTime() - second.startAt.getTime() ||
            byId(first, second)
          : second.endAt.getTime() - first.endAt.getTime() ||
            second.startAt.getTime() - first.startAt.getTime() ||
            byId(first, second),
      );
      return Promise.resolve(structuredClone(rows));
    },
    findById: (id: string) =>
      Promise.resolve(
        structuredClone(store.find((row) => row.id === id) ?? null),
      ),
  };
}

describe('Mis citas (integración HTTP con el plan del seed B-08)', () => {
  const jwt = new JwtService({ secret: 'my-appointments-flow-secret' });
  const tokens = {
    mentorA: jwt.sign({ sub: MENTOR_A, roleTag: 'mentor' }),
    mentorB: jwt.sign({ sub: PERFORMANCE_MENTOR, roleTag: 'mentor' }),
    graduate: jwt.sign({ sub: GRADUATE, roleTag: 'titulado' }),
    emptyGraduate: jwt.sign({ sub: EMPTY_GRADUATE, roleTag: 'titulado' }),
    multiRole: jwt.sign({ sub: MULTI_ROLE, roleTag: 'mentor' }),
  };
  let app: INestApplication;
  let store: AppointmentRecord[];

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    store = createStore();
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
              USERS[where.id]
                ? {
                    id: where.id,
                    email: `${where.id}@umssy.test`,
                    roles: USERS[where.id].roles.map((name) => ({
                      role: { name },
                    })),
                  }
                : null,
            ),
        },
      })
      .overrideProvider(JwtService)
      .useValue(jwt)
      .overrideProvider(AppointmentsRepository)
      .useValue(createRepository(store))
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const get = (token: string, path: string) =>
    http().get(path).set('Authorization', `Bearer ${token}`);
  const ids = (rows: MyAppointmentResponse[]) => rows.map((row) => row.id);

  it('1. devuelve las 50 citas de mentor.b en menos de 3 segundos por petición', async () => {
    const expectedIds = seededAppointments
      .filter((block) => block.mentorKey === 'performance')
      .map((block) => block.appointmentId);

    for (let sample = 0; sample < 3; sample += 1) {
      const startedAt = performance.now();
      const response = await get(
        tokens.mentorB,
        '/api/appointments/me?scope=upcoming',
      ).expect(200);
      expect(performance.now() - startedAt).toBeLessThan(RESPONSE_LIMIT_MS);

      const rows = response.body.data as MyAppointmentResponse[];
      expect(rows).toHaveLength(PERFORMANCE_APPOINTMENTS);
      expect(ids(rows)).toEqual(expectedIds);
      expect(
        rows.every(
          (row) => row.counterpart.id === GRADUATE && row.status === 'CONFIRMED',
        ),
      ).toBe(true);
    }
  });

  it.each([
    ['mentorA', MENTOR_A],
    ['graduate', GRADUATE],
  ] as const)(
    '2. lista solo las próximas de %s en orden cronológico',
    async (user, userId) => {
      const response = await get(
        tokens[user],
        '/api/appointments/me?scope=upcoming',
      ).expect(200);
      const expected = seededAppointments
        .filter(
          (block) =>
            block.end > NOW &&
            (userId === GRADUATE || mentorOf(block) === userId),
        )
        .sort((first, second) => first.start.getTime() - second.start.getTime())
        .map((block) => block.appointmentId);

      const rows = response.body.data as MyAppointmentResponse[];
      expect(rows.length).toBeGreaterThan(0);
      expect(ids(rows)).toEqual(expected);
      expect(rows.every((row) => Date.parse(row.endAt) > NOW.getTime())).toBe(
        true,
      );
      const defaultScope = await get(tokens[user], '/api/appointments/me').expect(
        200,
      );
      expect(defaultScope.body.data).toEqual(rows);
    },
  );

  it.each(['mentorA', 'graduate'] as const)(
    '3. lista las pasadas de %s de la más reciente a la más antigua',
    async (user) => {
      const extra = [-1, 1].map((offset, index) =>
        toRecord(
          `b0800003-0000-4000-8000-00000000000${index + 1}`,
          null,
          MENTOR_A,
          new Date(plan.past.start.getTime() + offset * DAY_MS),
          new Date(plan.past.end.getTime() + offset * DAY_MS),
        ),
      );
      store.push(...extra);

      const response = await get(
        tokens[user],
        '/api/appointments/me?scope=past',
      ).expect(200);

      const rows = response.body.data as MyAppointmentResponse[];
      expect(ids(rows)).toEqual([
        extra[1].id,
        plan.past.appointmentId,
        extra[0].id,
      ]);
      expect(rows.every((row) => Date.parse(row.endAt) <= NOW.getTime())).toBe(
        true,
      );
    },
  );

  it.each(['upcoming', 'past'])(
    '4. devuelve [] a un titulado sin citas %s',
    async (scope) => {
      const response = await get(
        tokens.emptyGraduate,
        `/api/appointments/me?scope=${scope}`,
      ).expect(200);
      expect(response.body).toMatchObject({
        statusCode: 200,
        ok: true,
        data: [],
      });
    },
  );

  it.each(['emptyGraduate', 'multiRole'] as const)(
    '5. responde 403 a %s sin exponer una cita ajena',
    async (user) => {
      const response = await get(
        tokens[user],
        `/api/appointments/${plan.next.appointmentId}`,
      ).expect(403);
      expect(response.body).toMatchObject({
        statusCode: 403,
        ok: false,
        data: null,
      });
      for (const value of [
        MENTOR_A,
        GRADUATE,
        plan.next.appointmentId!,
        plan.next.start.toISOString(),
      ]) {
        expect(JSON.stringify(response.body)).not.toContain(value);
      }
    },
  );

  it('6. muestra a ambos participantes los mismos datos con su contraparte', async () => {
    const id = plan.next.appointmentId!;
    const mentor = await get(tokens.mentorA, `/api/appointments/${id}`).expect(
      200,
    );
    const graduate = await get(
      tokens.graduate,
      `/api/appointments/${id}`,
    ).expect(200);
    const { counterpart: mentorCounterpart, ...mentorData } = mentor.body
      .data as MyAppointmentResponse;
    const { counterpart: graduateCounterpart, ...graduateData } = graduate.body
      .data as MyAppointmentResponse;

    expect(mentorData).toEqual(graduateData);
    expect(mentorData).toEqual({
      id,
      blockId: plan.next.id,
      startAt: plan.next.start.toISOString(),
      endAt: plan.next.end.toISOString(),
      orientationType: TOPIC,
      status: 'CONFIRMED',
    });
    expect(mentorCounterpart).toEqual({ id: GRADUATE, fullName: 'Titulado Uno', role: 'student' });
    expect(graduateCounterpart).toEqual({ id: MENTOR_A, fullName: 'Mentor Alfa', role: 'mentor' });

    for (const [token, detail] of [
      [tokens.mentorA, mentor],
      [tokens.graduate, graduate],
    ] as const) {
      const list = await get(token, '/api/appointments/me').expect(200);
      expect(
        (list.body.data as MyAppointmentResponse[]).find((row) => row.id === id),
      ).toEqual(detail.body.data);
    }
  });

  it('7. exige sesión y no permite elegir a otro usuario por la consulta', async () => {
    await http().get('/api/appointments/me').expect(401);
    const response = await get(
      tokens.emptyGraduate,
      `/api/appointments/me?userId=${MENTOR_A}`,
    ).expect(400);
    expect(response.body.ok).toBe(false);
    const spoofed = await get(tokens.emptyGraduate, '/api/appointments/me')
      .set('x-user-id', MENTOR_A)
      .expect(200);
    expect(spoofed.body.data).toEqual([]);
  });
});
