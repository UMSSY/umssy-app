import type { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { toBoliviaTime } from '../../../common/utils/date-time.js';
import { MentorNotFoundException } from '../../mentors/exceptions/mentor-not-found.exception.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { AvailabilityModule } from '../availability.module.js';
import { ACTIVE_APPOINTMENT_STATUSES } from '../constants/appointment-status.constants.js';
import { AppointmentStatusTitle } from '../enums/appointment-status-title.enum.js';
import {
  SEED_BLOCKED_DATE_ID,
  SEED_BLOCKED_REASON,
} from '../constants/seed-availability.constants.js';
import { AvailabilityRepository } from '../repositories/availability.repository.js';
import { BlockedDatesRepository } from '../repositories/blocked-dates.repository.js';
import { buildBlockPlan, getWeeks } from '../seeds/availability.seed.js';
import type { SeedBlock } from '../types/seed-block.types.js';

const NOW = new Date('2026-10-22T15:00:00.000Z');
const MENTOR_A = '11111111-1111-4111-8111-111111111111';
const MENTOR_B = '22222222-2222-4222-8222-222222222222';
const PERFORMANCE_MENTOR = '33333333-3333-4333-8333-333333333333';
const GRADUATE = '44444444-4444-4444-8444-444444444444';

const ROLES: Record<string, string> = {
  [MENTOR_A]: 'mentor',
  [MENTOR_B]: 'mentor',
  [PERFORMANCE_MENTOR]: 'mentor',
  [GRADUATE]: 'titulado',
};

interface StoredBlock {
  id: string;
  mentorId: string;
  startAt: Date;
  endAt: Date;
  seriesId: string | null;
  repeatUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  appointments: { status: { title: string } }[];
}

interface StoredBlockedDate {
  id: string;
  mentorId: string;
  blockedOn: Date;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const plan = buildBlockPlan(getWeeks(NOW), NOW);
const dayOf = (instant: Date) => toBoliviaTime(instant).date;
const nextWeek = getWeeks(NOW).next;
const NEXT_WEEK_QUERY = `from=${nextWeek.start.toISOString()}&to=${nextWeek.end.toISOString()}`;

function createStore() {
  const toStoredBlock = (block: SeedBlock): StoredBlock => ({
    id: block.id,
    mentorId: block.mentorKey === 'primary' ? MENTOR_A : PERFORMANCE_MENTOR,
    startAt: block.start,
    endAt: block.end,
    seriesId: block.seriesId ?? null,
    repeatUntil: block.repeatUntil ?? null,
    createdAt: NOW,
    updatedAt: NOW,
    appointments: block.appointmentId ? [{ status: { title: AppointmentStatusTitle.CONFIRMED } }] : [],
  });
  const blocks: StoredBlock[] = plan.blocks.map(toStoredBlock);
  const blockedDates: StoredBlockedDate[] = [
    {
      id: SEED_BLOCKED_DATE_ID,
      mentorId: MENTOR_A,
      blockedOn: plan.blockedOn,
      reason: SEED_BLOCKED_REASON,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];
  return { blocks, blockedDates };
}

const isActive = (appointment: { status: { title: string } }) =>
  ACTIVE_APPOINTMENT_STATUSES.some((status) => status === appointment.status.title);

function createRepositories(store: ReturnType<typeof createStore>) {
  const locks = new Map<string, Promise<unknown>>();
  const openTransactions = new Map<object, string>();
  let sequence = 0;
  const inRange = (block: StoredBlock, mentorId: string, from: Date, to: Date) =>
    block.mentorId === mentorId && block.startAt >= from && block.startAt < to;
  const assertInDayLock = (tx: unknown, mentorId: string, day: string) => {
    if (openTransactions.get(tx as object) !== `${mentorId}:${day}`) {
      throw new Error(`Escritura fuera del lock de ${mentorId} el ${day}`);
    }
  };
  const byStart = (first: StoredBlock, second: StoredBlock) =>
    first.startAt.getTime() - second.startAt.getTime();

  const blockedDatesRepository = {
    withDayLock: <T>(mentorId: string, day: string, work: (tx: unknown) => Promise<T>) => {
      const key = `${mentorId}:${day}`;
      const run = (locks.get(key) ?? Promise.resolve())
        .catch(() => undefined)
        .then(async () => {
          const tx = { key };
          openTransactions.set(tx, key);
          try {
            return await work(tx);
          } finally {
            openTransactions.delete(tx);
          }
        });
      locks.set(key, run);
      return run;
    },
    findByDay: (mentorId: string, blockedOn: Date) =>
      Promise.resolve(
        store.blockedDates.find(
          (item) => item.mentorId === mentorId && item.blockedOn.getTime() === blockedOn.getTime(),
        ) ?? null,
      ),
    findById: (id: string) => Promise.resolve(store.blockedDates.find((item) => item.id === id) ?? null),
    findInRange: (mentorId: string, fromDay: Date, toDay: Date) =>
      Promise.resolve(
        store.blockedDates
          .filter((item) => item.mentorId === mentorId && item.blockedOn >= fromDay && item.blockedOn <= toDay)
          .sort((first, second) => first.blockedOn.getTime() - second.blockedOn.getTime()),
      ),
    hasActiveAppointmentBetween: (mentorId: string, from: Date, to: Date) =>
      Promise.resolve(
        store.blocks.some((block) => inRange(block, mentorId, from, to) && block.appointments.some(isActive)),
      ),
    updateReason: (id: string, reason: string, tx: unknown) => {
      const blockedDate = store.blockedDates.find((item) => item.id === id) as StoredBlockedDate;
      assertInDayLock(tx, blockedDate.mentorId, blockedDate.blockedOn.toISOString().slice(0, 10));
      blockedDate.reason = reason;
      return Promise.resolve(blockedDate);
    },
    create: async (mentorId: string, blockedOn: Date, reason: string | null, tx: unknown) => {
      assertInDayLock(tx, mentorId, blockedOn.toISOString().slice(0, 10));
      await new Promise((resolve) => setTimeout(resolve, 5));
      sequence += 1;
      const created: StoredBlockedDate = {
        id: `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
        mentorId,
        blockedOn,
        reason,
        createdAt: NOW,
        updatedAt: NOW,
      };
      store.blockedDates.push(created);
      return created;
    },
    delete: (id: string) => {
      const index = store.blockedDates.findIndex((item) => item.id === id);
      const [deleted] = store.blockedDates.splice(index, 1);
      return Promise.resolve(deleted);
    },
  };

  const availabilityRepository = {
    findMentorBlocksInRange: (mentorId: string, from: Date, to: Date) =>
      Promise.resolve(store.blocks.filter((block) => inRange(block, mentorId, from, to)).sort(byStart)),
    findMentorFreeBlocksInRange: (mentorId: string, from: Date, to: Date) =>
      Promise.resolve(
        store.blocks
          .filter((block) => inRange(block, mentorId, from, to) && !block.appointments.some(isActive))
          .sort(byStart),
      ),
    findById: (id: string) => Promise.resolve(store.blocks.find((block) => block.id === id) ?? null),
    update: (id: string, data: { startAt: Date; endAt: Date }, tx?: unknown) => {
      const block = store.blocks.find((item) => item.id === id) as StoredBlock;
      if (dayOf(block.startAt) !== dayOf(data.startAt)) {
        assertInDayLock(tx, block.mentorId, dayOf(data.startAt));
      }
      Object.assign(block, data, { updatedAt: NOW });
      return Promise.resolve(block);
    },
    create: (mentorId: string, startAt: Date, endAt: Date, tx: unknown) => {
      assertInDayLock(tx, mentorId, dayOf(startAt));
      sequence += 1;
      const created: StoredBlock = {
        id: `00000000-0000-4000-9000-${String(sequence).padStart(12, '0')}`,
        mentorId,
        startAt,
        endAt,
        seriesId: null,
        repeatUntil: null,
        createdAt: NOW,
        updatedAt: NOW,
        appointments: [],
      };
      store.blocks.push(created);
      return Promise.resolve(created);
    },
  };

  return { blockedDatesRepository, availabilityRepository };
}

describe('Fechas bloqueadas (integración HTTP con el plan del seed B-08)', () => {
  const jwt = new JwtService({ secret: 'blocked-dates-flow-secret' });
  const tokens = {
    mentorA: jwt.sign({ sub: MENTOR_A, roleTag: 'mentor' }),
    mentorB: jwt.sign({ sub: MENTOR_B, roleTag: 'mentor' }),
    graduate: jwt.sign({ sub: GRADUATE, roleTag: 'titulado' }),
  };
  let app: INestApplication;
  let store: ReturnType<typeof createStore>;

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    store = createStore();
    const { blockedDatesRepository, availabilityRepository } = createRepositories(store);
    const moduleRef = await Test.createTestingModule({
      imports: [AvailabilityModule],
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
              ROLES[where.id]
                ? { id: where.id, email: `${where.id}@umssy.test`, roles: [{ role: { name: ROLES[where.id] } }] }
                : null,
            ),
        },
      })
      .overrideProvider(JwtService)
      .useValue(jwt)
      .overrideProvider(MentorsService)
      .useValue({
        findOne: (id: string) =>
          ROLES[id] === 'mentor'
            ? Promise.resolve({ id, isAvailable: true })
            : Promise.reject(new MentorNotFoundException()),
      })
      .overrideProvider(BlockedDatesRepository)
      .useValue(blockedDatesRepository)
      .overrideProvider(AvailabilityRepository)
      .useValue(availabilityRepository)
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const blockDate = (token: string, body: Record<string, unknown>) =>
    http().post('/api/blocked-dates').set('Authorization', `Bearer ${token}`).send(body);
  const listBlockedDates = async (token = tokens.mentorA) =>
    (
      await http()
        .get(`/api/blocked-dates?${NEXT_WEEK_QUERY}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
    ).body.data as { id: string; blockedOn: string; reason: string | null }[];
  const freeBlockIdsOfMentorA = async () =>
    (
      (
        await http()
          .get(`/api/mentors/${MENTOR_A}/free-blocks?${NEXT_WEEK_QUERY}`)
          .set('Authorization', `Bearer ${tokens.graduate}`)
          .expect(200)
      ).body.data as { id: string }[]
    ).map((block) => block.id);

  const futureDayWithoutBlocks = () => {
    const busyDays = new Set(store.blocks.filter((block) => block.mentorId === MENTOR_A).map((block) => dayOf(block.startAt)));
    const blockedDays = new Set(store.blockedDates.map((item) => item.blockedOn.toISOString().slice(0, 10)));
    for (let offset = 0; offset < 7; offset += 1) {
      const day = dayOf(new Date(nextWeek.start.getTime() + offset * 86_400_000));
      if (!busyDays.has(day) && !blockedDays.has(day)) return day;
    }
    throw new Error('El plan del seed no deja un día libre en la semana siguiente');
  };

  it('1. bloquea un día futuro, con o sin motivo, y lo lista', async () => {
    const day = futureDayWithoutBlocks();

    const response = await blockDate(tokens.mentorA, { blockedOn: day }).expect(201);

    expect(response.body).toMatchObject({
      statusCode: 201,
      ok: true,
      data: { mentorId: MENTOR_A, blockedOn: day, reason: null },
    });
    expect((await listBlockedDates()).map((item) => item.blockedOn)).toEqual(
      [dayOf(plan.blocked.start), day].sort(),
    );
  });

  it('2. desbloquea la fecha del seed y sus horarios libres vuelven sin cambios', async () => {
    expect(await freeBlockIdsOfMentorA()).not.toContain(plan.blocked.id);

    await http()
      .delete(`/api/blocked-dates/${SEED_BLOCKED_DATE_ID}`)
      .set('Authorization', `Bearer ${tokens.mentorA}`)
      .expect(200, { statusCode: 200, ok: true, detail: 'Operación exitosa', data: { id: SEED_BLOCKED_DATE_ID } });

    expect(await freeBlockIdsOfMentorA()).toContain(plan.blocked.id);
    expect(store.blocks.find((block) => block.id === plan.blocked.id)).toMatchObject({
      startAt: plan.blocked.start,
      endAt: plan.blocked.end,
    });
    expect(await listBlockedDates()).toEqual([]);
  });

  it('3. no bloquea un día con una cita confirmada (409) y no guarda nada', async () => {
    const response = await blockDate(tokens.mentorA, { blockedOn: dayOf(plan.next.start) }).expect(409);

    expect(response.body).toEqual({
      statusCode: 409,
      data: null,
      detail: 'No puedes bloquear un día con citas confirmadas',
      ok: false,
    });
    expect(store.blockedDates).toHaveLength(1);
  });

  it('4. no bloquea una fecha pasada (400)', async () => {
    const yesterday = dayOf(new Date(NOW.getTime() - 86_400_000));

    const response = await blockDate(tokens.mentorA, { blockedOn: yesterday }).expect(400);

    expect(response.body.detail).toBe('No se pueden bloquear fechas pasadas');
    expect(store.blockedDates).toHaveLength(1);
  });

  it('5. rechaza un motivo de más de 100 caracteres (400) y acepta uno de 100', async () => {
    const day = futureDayWithoutBlocks();

    const tooLong = await blockDate(tokens.mentorA, { blockedOn: day, reason: 'a'.repeat(101) }).expect(400);
    expect(JSON.stringify(tooLong.body)).toContain('El motivo admite hasta 100 caracteres');
    expect(store.blockedDates).toHaveLength(1);

    await blockDate(tokens.mentorA, { blockedOn: day, reason: 'a'.repeat(100) }).expect(201);
  });

  it('6. otro mentor no puede desbloquear la fecha (403) y la fecha sigue bloqueada', async () => {
    const response = await http()
      .delete(`/api/blocked-dates/${SEED_BLOCKED_DATE_ID}`)
      .set('Authorization', `Bearer ${tokens.mentorB}`)
      .expect(403);

    expect(response.body.detail).toBe('La fecha bloqueada no pertenece al usuario');
    expect((await listBlockedDates()).map((item) => item.id)).toEqual([SEED_BLOCKED_DATE_ID]);
    expect(await listBlockedDates(tokens.mentorB)).toEqual([]);
  });

  it('7. los horarios libres no incluyen los del día bloqueado, pero sí los de otros días', async () => {
    const ids = await freeBlockIdsOfMentorA();

    expect(ids).toContain(plan.free.id);
    expect(ids).not.toContain(plan.blocked.id);
    expect(ids).not.toContain(plan.next.id);
  });

  it('crea un bloque en un día libre y el titulado lo ve entre los horarios libres', async () => {
    const day = futureDayWithoutBlocks();
    const response = await http()
      .post('/api/availability-blocks')
      .set('Authorization', `Bearer ${tokens.mentorA}`)
      .send({ startAt: `${day}T11:00:00-04:00`, endAt: `${day}T12:00:00-04:00` })
      .expect(201);

    expect(response.body.data).toMatchObject({ mentorId: MENTOR_A, state: 'free' });
    expect(await freeBlockIdsOfMentorA()).toContain(response.body.data.id);
  });

  it('no deja crear un bloque nuevo en un día bloqueado (409)', async () => {
    const day = dayOf(plan.blocked.start);
    const response = await http()
      .post('/api/availability-blocks')
      .set('Authorization', `Bearer ${tokens.mentorA}`)
      .send({ startAt: `${day}T11:00:00-04:00`, endAt: `${day}T12:00:00-04:00` })
      .expect(409);

    expect(response.body.detail).toBe('Ese día está bloqueado');
  });

  it('no deja mover un bloque libre a un día bloqueado (409) y el bloque queda igual', async () => {
    const day = dayOf(plan.blocked.start);
    const response = await http()
      .patch(`/api/availability-blocks/${plan.free.id}`)
      .set('Authorization', `Bearer ${tokens.mentorA}`)
      .send({ startAt: `${day}T18:00:00-04:00`, endAt: `${day}T19:00:00-04:00` })
      .expect(409);

    expect(response.body.detail).toBe('Ese día está bloqueado');
    expect(store.blocks.find((block) => block.id === plan.free.id)).toMatchObject({
      startAt: plan.free.start,
      endAt: plan.free.end,
    });
  });

  it('bloquea un día cuya única cita está cancelada', async () => {
    const day = futureDayWithoutBlocks();
    store.blocks.push({
      id: 'cancelled-block',
      mentorId: MENTOR_A,
      startAt: new Date(`${day}T14:00:00.000Z`),
      endAt: new Date(`${day}T15:00:00.000Z`),
      seriesId: null,
      repeatUntil: null,
      createdAt: NOW,
      updatedAt: NOW,
      appointments: [{ status: { title: AppointmentStatusTitle.CANCELLED } }],
    });

    await blockDate(tokens.mentorA, { blockedOn: day }).expect(201);
  });

  it('deja editar un bloque dentro de su día bloqueado sin moverlo de día', async () => {
    const day = dayOf(plan.blocked.start);
    const response = await http()
      .patch(`/api/availability-blocks/${plan.blocked.id}`)
      .set('Authorization', `Bearer ${tokens.mentorA}`)
      .send({ startAt: `${day}T09:00:00-04:00`, endAt: `${day}T09:30:00-04:00` })
      .expect(200);

    expect(response.body.data.startAt).toBe(new Date(`${day}T09:00:00-04:00`).toISOString());
    expect(await freeBlockIdsOfMentorA()).not.toContain(plan.blocked.id);
  });

  it('volver a bloquear una fecha con otro motivo actualiza el motivo sin duplicarla', async () => {
    const response = await blockDate(tokens.mentorA, {
      blockedOn: dayOf(plan.blocked.start),
      reason: 'Congreso nacional',
    }).expect(201);

    expect(response.body.data).toMatchObject({ id: SEED_BLOCKED_DATE_ID, reason: 'Congreso nacional' });
    expect(store.blockedDates).toHaveLength(1);
  });

  it('bloquear la misma fecha varias veces, incluso en paralelo, deja un solo registro', async () => {
    const day = futureDayWithoutBlocks();

    const responses = await Promise.all(
      Array.from({ length: 5 }, () => blockDate(tokens.mentorA, { blockedOn: day, reason: 'Paralelo' })),
    );

    expect(responses.map((response) => response.status)).toEqual([201, 201, 201, 201, 201]);
    expect(new Set(responses.map((response) => response.body.data.id)).size).toBe(1);
    expect(store.blockedDates.filter((item) => item.blockedOn.toISOString().startsWith(day))).toHaveLength(1);
  });

  it('solo el rol mentor puede bloquear fechas', async () => {
    const response = await blockDate(tokens.graduate, { blockedOn: futureDayWithoutBlocks() }).expect(403);
    expect(response.body.ok).toBe(false);
    await http().post('/api/blocked-dates').send({ blockedOn: futureDayWithoutBlocks() }).expect(401);
  });
});
