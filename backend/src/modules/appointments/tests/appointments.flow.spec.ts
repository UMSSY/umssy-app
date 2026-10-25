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
import { toBoliviaTime } from '../../../common/utils/date-time.js';
import { MentorNotFoundException } from '../../mentors/exceptions/mentor-not-found.exception.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { ACTIVE_APPOINTMENT_STATUSES } from '../../availability/constants/appointment-status.constants.js';
import {
  SEED_BLOCKED_DATE_ID,
  SEED_BLOCKED_REASON,
  SEED_SERIES_ID,
} from '../../availability/constants/seed-availability.constants.js';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { AvailabilityRepository } from '../../availability/repositories/availability.repository.js';
import { BlockedDatesRepository } from '../../availability/repositories/blocked-dates.repository.js';
import {
  buildBlockPlan,
  getWeeks,
} from '../../availability/seeds/availability.seed.js';
import type { SeedBlock } from '../../availability/types/seed-block.types.js';
import { AppointmentsModule } from '../appointments.module.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import type { CreateAppointmentData } from '../types/create-appointment-data.types.js';
import type { CreateAppointmentHistoryData } from '../types/create-appointment-history-data.types.js';

const NOW = new Date('2026-10-22T15:00:00.000Z');
const MENTOR_A = '11111111-1111-4111-8111-111111111111';
const PERFORMANCE_MENTOR = '33333333-3333-4333-8333-333333333333';
const GRADUATE = '44444444-4444-4444-8444-444444444444';
const STUDENT = '88888888-8888-4888-8888-888888888888';
const TOPIC_ID = '66666666-6666-4666-8666-666666666666';
const OTHER_TOPIC_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const STATUS_ID = '77777777-7777-4777-8777-777777777777';

const USERS: Record<string, { firstName: string; lastName: string }> = {
  [MENTOR_A]: { firstName: 'Ana', lastName: 'Pérez' },
  [GRADUATE]: { firstName: 'Luis', lastName: 'Flores' },
  [STUDENT]: { firstName: 'María', lastName: 'Quispe' },
};

const ROLES: Record<string, string> = {
  [MENTOR_A]: 'mentor',
  [GRADUATE]: 'titulado',
  [STUDENT]: 'estudiante',
};

const ORIENTATION_NAMES: Record<string, string> = {
  [TOPIC_ID]: 'Orientación profesional',
};

interface StoredAppointment {
  id: string;
  blockId: string;
  mentorId: string;
  studentId: string;
  startAt: Date;
  endAt: Date;
  statusId: string;
  orientationTypeId: string;
  message: string | null;
}

interface StoredBlock {
  id: string;
  mentorId: string;
  startAt: Date;
  endAt: Date;
  seriesId: string | null;
  repeatUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  appointments: { id: string; status: { title: string } }[];
}

interface StoredBlockedDate {
  id: string;
  mentorId: string;
  blockedOn: Date;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StoredMentor {
  id: string;
  isAvailable: boolean;
  orientationTypeIds: string[];
}

interface Store {
  blocks: StoredBlock[];
  blockedDates: StoredBlockedDate[];
  appointments: StoredAppointment[];
  histories: CreateAppointmentHistoryData[];
  mentors: Map<string, StoredMentor>;
}

const plan = buildBlockPlan(getWeeks(NOW), NOW);
const nextWeek = getWeeks(NOW).next;
const NEXT_WEEK_QUERY = `from=${nextWeek.start.toISOString()}&to=${nextWeek.end.toISOString()}`;
const dayOf = (instant: Date) => toBoliviaTime(instant).date;
const isActive = (appointment: { status: { title: string } }) =>
  ACTIVE_APPOINTMENT_STATUSES.some(
    (status) => status === appointment.status.title,
  );

function createStore(): Store {
  const toStoredBlock = (block: SeedBlock): StoredBlock => ({
    id: block.id,
    mentorId: block.mentorKey === 'primary' ? MENTOR_A : PERFORMANCE_MENTOR,
    startAt: block.start,
    endAt: block.end,
    seriesId: block.seriesId ?? null,
    repeatUntil: block.repeatUntil ?? null,
    createdAt: NOW,
    updatedAt: NOW,
    appointments: block.appointmentId
      ? [
          {
            id: block.appointmentId,
            status: { title: AppointmentStatusTitle.CONFIRMED },
          },
        ]
      : [],
  });

  return {
    blocks: plan.blocks.map(toStoredBlock),
    blockedDates: [
      {
        id: SEED_BLOCKED_DATE_ID,
        mentorId: MENTOR_A,
        blockedOn: plan.blockedOn,
        reason: SEED_BLOCKED_REASON,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    appointments: [],
    histories: [],
    mentors: new Map([
      [
        MENTOR_A,
        { id: MENTOR_A, isAvailable: true, orientationTypeIds: [TOPIC_ID] },
      ],
    ]),
  };
}

function createRepositories(store: Store) {
  const locks = new Map<string, Promise<unknown>>();
  const openLocks = new Map<object, string>();
  let sequence = 0;
  const assertUnderDayLock = (
    client: unknown,
    mentorId: string,
    day: string,
  ) => {
    if (openLocks.get(client as object) !== `${mentorId}:${day}`) {
      throw new Error(`Escritura fuera del candado de ${mentorId} el ${day}`);
    }
  };

  const blockedDatesRepository = {
    withDayLock: <T>(
      mentorId: string,
      day: string,
      work: (tx: unknown) => Promise<T>,
    ) => {
      const key = `${mentorId}:${day}`;
      const run = (locks.get(key) ?? Promise.resolve())
        .catch(() => undefined)
        .then(async () => {
          const tx = { key };
          openLocks.set(tx, key);
          try {
            return await work(tx);
          } finally {
            openLocks.delete(tx);
          }
        });
      locks.set(key, run);
      return run;
    },
    findByDay: (mentorId: string, blockedOn: Date) =>
      Promise.resolve(
        store.blockedDates.find(
          (item) =>
            item.mentorId === mentorId &&
            item.blockedOn.getTime() === blockedOn.getTime(),
        ) ?? null,
      ),
    findInRange: (mentorId: string, fromDay: Date, toDay: Date) =>
      Promise.resolve(
        store.blockedDates
          .filter(
            (item) =>
              item.mentorId === mentorId &&
              item.blockedOn >= fromDay &&
              item.blockedOn <= toDay,
          )
          .sort(
            (first, second) =>
              first.blockedOn.getTime() - second.blockedOn.getTime(),
          ),
      ),
    hasActiveAppointmentBetween: (
      mentorId: string,
      from: Date,
      to: Date,
    ) =>
      Promise.resolve(
        store.blocks.some(
          (block) =>
            block.mentorId === mentorId &&
            block.startAt >= from &&
            block.startAt < to &&
            block.appointments.some(isActive),
        ),
      ),
    create: async (
      mentorId: string,
      blockedOn: Date,
      reason: string | null,
      tx: unknown,
    ) => {
      assertUnderDayLock(tx, mentorId, blockedOn.toISOString().slice(0, 10));
      sequence += 1;
      const created: StoredBlockedDate = {
        id: `b0800002-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
        mentorId,
        blockedOn,
        reason,
        createdAt: NOW,
        updatedAt: NOW,
      };
      store.blockedDates.push(created);
      return created;
    },
    updateReason: (id: string, reason: string, tx: unknown) => {
      const blockedDate = store.blockedDates.find(
        (item) => item.id === id,
      ) as StoredBlockedDate;
      assertUnderDayLock(
        tx,
        blockedDate.mentorId,
        blockedDate.blockedOn.toISOString().slice(0, 10),
      );
      blockedDate.reason = reason;
      return Promise.resolve(blockedDate);
    },
  };

  const availabilityRepository = {
    findById: (id: string) =>
      Promise.resolve(store.blocks.find((block) => block.id === id) ?? null),
    findMentorFreeBlocksInRange: (mentorId: string, from: Date, to: Date) =>
      Promise.resolve(
        store.blocks
          .filter(
            (block) =>
              block.mentorId === mentorId &&
              block.startAt >= from &&
              block.startAt < to &&
              !block.appointments.some(isActive),
          )
          .sort((first, second) => {
            return first.startAt.getTime() - second.startAt.getTime();
          }),
      ),
  };

  const appointmentsRepository = {
    findStatusIdByTitle: (title: AppointmentStatusTitle) =>
      Promise.resolve(
        title === AppointmentStatusTitle.CONFIRMED
          ? STATUS_ID
          : `status-${title}`,
      ),
    createAppointment: async (data: CreateAppointmentData, tx: unknown) => {
      const block = store.blocks.find(
        (item) => item.id === data.blockId,
      ) as StoredBlock;
      assertUnderDayLock(tx, block.mentorId, dayOf(data.startAt));
      await new Promise((resolve) => setTimeout(resolve, 5));
      sequence += 1;
      const appointment: StoredAppointment = {
        id: `b0800001-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
        blockId: data.blockId,
        mentorId: data.mentorId,
        studentId: data.studentId,
        startAt: data.startAt,
        endAt: data.endAt,
        statusId: data.statusId,
        orientationTypeId: data.orientationTypeId,
        message: data.message ?? null,
      };
      store.appointments.push(appointment);
      block.appointments.push({
        id: appointment.id,
        status: { title: AppointmentStatusTitle.CONFIRMED },
      });
      return {
        id: appointment.id,
        blockId: appointment.blockId,
        mentorId: appointment.mentorId,
        studentId: appointment.studentId,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        mentor: { id: appointment.mentorId, ...USERS[appointment.mentorId] },
        student: {
          id: appointment.studentId,
          ...USERS[appointment.studentId],
        },
        orientationType: {
          id: appointment.orientationTypeId,
          name: ORIENTATION_NAMES[appointment.orientationTypeId],
        },
        status: { title: AppointmentStatusTitle.CONFIRMED },
      };
    },
    createAppointmentHistory: async (
      data: CreateAppointmentHistoryData,
      tx: unknown,
    ) => {
      const appointment = store.appointments.find(
        (item) => item.id === data.appointmentId,
      ) as StoredAppointment;
      const block = store.blocks.find(
        (item) => item.id === appointment.blockId,
      ) as StoredBlock;
      assertUnderDayLock(tx, block.mentorId, dayOf(appointment.startAt));
      store.histories.push(data);
    },
  };

  return { blockedDatesRepository, availabilityRepository, appointmentsRepository };
}

function createMentors(store: Store) {
  return {
    findOne: (id: string) => {
      const mentor = store.mentors.get(id);
      if (!mentor) {
        return Promise.reject(new MentorNotFoundException());
      }
      return Promise.resolve({
        id: mentor.id,
        isAvailable: mentor.isAvailable,
        orientationTypes: mentor.orientationTypeIds.map((topicId) => ({
          id: topicId,
          name: ORIENTATION_NAMES[topicId],
          description: null,
        })),
      });
    },
  };
}

const raceBlock = plan.blocks.find(
  (block) => block.seriesId === SEED_SERIES_ID,
) as SeedBlock;

describe('Reserva de citas (integración HTTP con el plan del seed B-08)', () => {
  const jwt = new JwtService({ secret: 'appointment-booking-flow-secret' });
  const tokens = {
    mentorA: jwt.sign({ sub: MENTOR_A, roleTag: 'mentor' }),
    graduate: jwt.sign({ sub: GRADUATE, roleTag: 'titulado' }),
    student: jwt.sign({ sub: STUDENT, roleTag: 'estudiante' }),
  };
  let app: INestApplication;
  let store: Store;

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    store = createStore();
    const {
      blockedDatesRepository,
      availabilityRepository,
      appointmentsRepository,
    } = createRepositories(store);
    const mentorsService = createMentors(store);
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
              ROLES[where.id]
                ? {
                    id: where.id,
                    email: `${where.id}@umssy.test`,
                    roles: [{ role: { name: ROLES[where.id] } }],
                  }
                : null,
            ),
        },
      })
      .overrideProvider(JwtService)
      .useValue(jwt)
      .overrideProvider(MentorsService)
      .useValue(mentorsService)
      .overrideProvider(BlockedDatesRepository)
      .useValue(blockedDatesRepository)
      .overrideProvider(AvailabilityRepository)
      .useValue(availabilityRepository)
      .overrideProvider(AppointmentsRepository)
      .useValue(appointmentsRepository)
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const book = (token: string, body: Record<string, unknown>) =>
    http()
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  const blockDate = (token: string, body: Record<string, unknown>) =>
    http()
      .post('/api/blocked-dates')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  const freeBlockIds = async () =>
    (
      (
        await http()
          .get(`/api/mentors/${MENTOR_A}/free-blocks?${NEXT_WEEK_QUERY}`)
          .set('Authorization', `Bearer ${tokens.graduate}`)
          .expect(200)
      ).body.data as { id: string }[]
    ).map((block) => block.id);

  it('1. confirma una reserva válida, registra el historial y deja de ofrecer el horario', async () => {
    const response = await book(tokens.graduate, {
      blockId: plan.free.id,
      orientationTypeId: TOPIC_ID,
      message: 'Quiero reforzar mis bases',
    }).expect(201);

    expect(response.body).toMatchObject({
      statusCode: 201,
      ok: true,
      data: {
        blockId: plan.free.id,
        status: AppointmentStatusTitle.CONFIRMED,
        counterpart: { id: MENTOR_A, fullName: 'Ana Pérez' },
        orientationType: { id: TOPIC_ID },
      },
    });
    expect(store.appointments).toHaveLength(1);
    expect(store.appointments[0]).toMatchObject({
      blockId: plan.free.id,
      mentorId: MENTOR_A,
      studentId: GRADUATE,
      orientationTypeId: TOPIC_ID,
      message: 'Quiero reforzar mis bases',
    });
    expect(store.histories).toEqual([
      {
        appointmentId: store.appointments[0].id,
        previousStatusId: null,
        newStatusId: STATUS_ID,
        changedById: GRADUATE,
      },
    ]);
    expect(await freeBlockIds()).not.toContain(plan.free.id);
  });

  it('2. rechaza un horario que ya tiene una cita confirmada', async () => {
    expect(await freeBlockIds()).not.toContain(plan.next.id);

    const response = await book(tokens.graduate, {
      blockId: plan.next.id,
      orientationTypeId: TOPIC_ID,
    }).expect(409);

    expect(response.body.detail).toBe('Este horario ya fue reservado');
    expect(store.appointments).toHaveLength(0);
    expect(store.histories).toHaveLength(0);
  });

  it('3. dos reservas simultáneas del mismo horario crean una sola cita', async () => {
    const [first, second] = await Promise.all([
      book(tokens.graduate, {
        blockId: plan.free.id,
        orientationTypeId: TOPIC_ID,
      }),
      book(tokens.student, {
        blockId: plan.free.id,
        orientationTypeId: TOPIC_ID,
      }),
    ]);

    expect([first.status, second.status].sort((a, b) => a - b)).toEqual([
      201, 409,
    ]);
    const rejected = first.status === 409 ? first : second;
    expect(rejected.body.detail).toBe('Este horario ya fue reservado');
    expect(store.appointments).toHaveLength(1);
    expect(store.histories).toHaveLength(1);
    expect(await freeBlockIds()).not.toContain(plan.free.id);
  });

  it('4. rechaza un horario de una semana pasada', async () => {
    const response = await book(tokens.graduate, {
      blockId: plan.past.id,
      orientationTypeId: TOPIC_ID,
    }).expect(400);

    expect(response.body.detail).toBe('El horario ya pasó');
    expect(store.appointments).toHaveLength(0);
  });

  it('5. rechaza un horario de una fecha bloqueada', async () => {
    const response = await book(tokens.graduate, {
      blockId: plan.blocked.id,
      orientationTypeId: TOPIC_ID,
    }).expect(409);

    expect(response.body.detail).toBe('Ese día está bloqueado');
    expect(store.appointments).toHaveLength(0);
    expect(store.histories).toHaveLength(0);
  });

  it('6. rechaza la reserva cuando el mentor pausó su disponibilidad', async () => {
    (store.mentors.get(MENTOR_A) as StoredMentor).isAvailable = false;

    const response = await book(tokens.graduate, {
      blockId: plan.free.id,
      orientationTypeId: TOPIC_ID,
    }).expect(403);

    expect(response.body.detail).toBe(
      'El mentor no está disponible para recibir citas',
    );
    expect(store.appointments).toHaveLength(0);
  });

  it('7. rechaza la reserva del propio bloque del mentor', async () => {
    const response = await book(tokens.mentorA, {
      blockId: plan.free.id,
      orientationTypeId: TOPIC_ID,
    }).expect(403);

    expect(response.body.detail).toBe('No puedes reservar tu propio horario');
    expect(store.appointments).toHaveLength(0);
  });

  it('8. un doble clic sobre el mismo horario registra una sola cita', async () => {
    await book(tokens.graduate, {
      blockId: plan.free.id,
      orientationTypeId: TOPIC_ID,
    }).expect(201);

    const response = await book(tokens.graduate, {
      blockId: plan.free.id,
      orientationTypeId: TOPIC_ID,
    }).expect(409);

    expect(response.body.detail).toBe('Este horario ya fue reservado');
    expect(store.appointments).toHaveLength(1);
    expect(store.histories).toHaveLength(1);
  });

  it('9. rechaza un tema con formato inválido y uno que el mentor no ofrece', async () => {
    const invalid = await book(tokens.graduate, {
      blockId: plan.free.id,
      orientationTypeId: 'tema-raro',
    }).expect(400);

    expect(invalid.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['orientationTypeId'],
          message: 'El tema de la sesión no es válido',
        }),
      ]),
    );

    const notOffered = await book(tokens.graduate, {
      blockId: plan.free.id,
      orientationTypeId: OTHER_TOPIC_ID,
    }).expect(400);

    expect(notOffered.body.detail).toBe('El tema de la sesión no es válido');
    expect(store.appointments).toHaveLength(0);
    expect(store.histories).toHaveLength(0);
  });

  it('10. si la reserva se confirma primero, el bloqueo del día se rechaza', async () => {
    await book(tokens.graduate, {
      blockId: raceBlock.id,
      orientationTypeId: TOPIC_ID,
    }).expect(201);

    const response = await blockDate(tokens.mentorA, {
      blockedOn: dayOf(raceBlock.start),
    }).expect(409);

    expect(response.body.detail).toBe(
      'No puedes bloquear un día con citas confirmadas',
    );
    expect(store.appointments).toHaveLength(1);
    expect(store.blockedDates).toHaveLength(1);
  });

  it('11. si el bloqueo se registra primero, la reserva se rechaza', async () => {
    await blockDate(tokens.mentorA, {
      blockedOn: dayOf(raceBlock.start),
      reason: 'Imprevisto',
    }).expect(201);

    const response = await book(tokens.graduate, {
      blockId: raceBlock.id,
      orientationTypeId: TOPIC_ID,
    }).expect(409);

    expect(response.body.detail).toBe('Ese día está bloqueado');
    expect(store.appointments).toHaveLength(0);
    expect(store.histories).toHaveLength(0);
    expect(store.blockedDates).toHaveLength(2);
  });

  it('12. una reserva y un bloqueo simultáneos nunca dejan una cita en la fecha bloqueada', async () => {
    const [booking, blocking] = await Promise.all([
      book(tokens.graduate, {
        blockId: raceBlock.id,
        orientationTypeId: TOPIC_ID,
      }),
      blockDate(tokens.mentorA, { blockedOn: dayOf(raceBlock.start) }),
    ]);

    expect(
      [booking.status, blocking.status].filter((status) => status === 201),
    ).toHaveLength(1);
    const dayBlocked = store.blockedDates.some((item) =>
      item.blockedOn.toISOString().startsWith(dayOf(raceBlock.start)),
    );
    const appointmentInsideBlockedDay = store.appointments.some(
      (appointment) =>
        dayBlocked && dayOf(appointment.startAt) === dayOf(raceBlock.start),
    );
    expect(appointmentInsideBlockedDay).toBe(false);
  });
});
