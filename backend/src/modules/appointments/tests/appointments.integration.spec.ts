import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { PrismaClient } from '../../../prisma/client.js';
import {
  PERFORMANCE_APPOINTMENTS,
  SEED_APPOINTMENT_IDS,
} from '../../availability/constants/seed-availability.constants.js';
import { seedAvailability } from '../../availability/seeds/availability.seed.js';
import type { AvailabilitySeedResult } from '../../availability/types/availability-seed-result.types.js';
import { seedOrientationTypes } from '../../orientation-types/seeds/orientation-types.seed.js';
import { SEED_PASSWORD } from '../../users/constants/seed-users.constants.js';
import { hashSeedPassword, seedUsers } from '../../users/seeds/users.seed.js';
import type { SeedUsers } from '../../users/types/seed-users.types.js';
import { AppointmentsModule } from '../appointments.module.js';
import type { MyAppointmentResponse } from '../types/my-appointment-response.types.js';

const execute = promisify(execFile);
const require = createRequire(import.meta.url);
const DATABASE = 'appointments_h6_test';
const DATABASE_USER = 'appointments_test';
const SETUP_TIMEOUT_MS = 360_000;
const RESPONSE_LIMIT_MS = 3_000;
const DAY_MS = 86_400_000;

// No acepta conexiones externas: cada ejecución crea y elimina únicamente su contenedor.
describe('HU-06: seeded appointments over HTTP and PostgreSQL', () => {
  const container = `umssy-h6e-${randomUUID()}`;
  const password = randomUUID();
  let containerCreated = false;
  let prisma: PrismaClient | undefined;
  let app: INestApplication | undefined;
  let users: SeedUsers;
  let seed: AvailabilitySeedResult;
  let now: Date;
  const tokens = new Map<string, string>();

  const http = () => request(app!.getHttpServer());
  const get = (user: keyof SeedUsers, path: string) =>
    http()
      .get(path)
      .set('Authorization', `Bearer ${tokens.get(user)}`)
      .timeout({
        response: RESPONSE_LIMIT_MS,
        deadline: RESPONSE_LIMIT_MS + 500,
      });
  const ids = (rows: MyAppointmentResponse[]) => rows.map((row) => row.id);

  beforeAll(async () => {
    await execute(
      'docker',
      [
        'run',
        '--detach',
        '--rm',
        '--name',
        container,
        '--label',
        'umssy.issue=1173',
        '--publish',
        '127.0.0.1::5432',
        '--env',
        `POSTGRES_DB=${DATABASE}`,
        '--env',
        `POSTGRES_USER=${DATABASE_USER}`,
        '--env',
        `POSTGRES_PASSWORD=${password}`,
        'postgres:18-alpine',
      ],
      { timeout: 120_000 },
    );
    containerCreated = true;
    const { stdout } = await execute('docker', ['port', container, '5432/tcp']);
    const port = stdout.trim().match(/^127\.0\.0\.1:(\d+)$/)?.[1];
    if (!port)
      throw new Error('No se pudo determinar el puerto del PostgreSQL aislado');

    const connectionString = `postgresql://${DATABASE_USER}:${password}@127.0.0.1:${port}/${DATABASE}`;
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString, max: 3 }),
    });
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        ready = true;
        break;
      } catch {
        await delay(200);
      }
    }
    if (!ready) throw new Error('El PostgreSQL aislado no inició a tiempo');

    await execute(
      process.execPath,
      [
        require.resolve('prisma/build/index.js'),
        'migrate',
        'deploy',
        '--config',
        'prisma7.config.ts',
      ],
      {
        timeout: 180_000,
        env: {
          ...process.env,
          DB_HOST: '127.0.0.1',
          DB_PORT: port,
          DB_NAME: DATABASE,
          DB_USER: DATABASE_USER,
          DB_PASSWORD: password,
          DB_SCHEMA: 'public',
        },
      },
    );
    const [identity] = await prisma.$queryRaw<Array<{ database: string }>>`
      SELECT current_database() AS database
    `;
    expect(identity.database).toBe(DATABASE);

    const passwordHash = await hashSeedPassword();
    const result = await prisma.$transaction((tx) =>
      seedUsers(tx, passwordHash),
    );
    users = result.users;
    // Congela solo Date después de crear roles; el reloj de rendimiento y la red siguen reales.
    now = new Date();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(now);
    seed = await prisma.$transaction(
      async (tx) => {
        await seedOrientationTypes(tx);
        return seedAvailability(
          tx,
          {
            mentorId: users.mentorA.id,
            performanceMentorId: users.mentorB.id,
            graduateId: users.graduate.id,
          },
          now,
        );
      },
      { timeout: 30_000 },
    );
    expect(seed.appointments).toBe(53);
    expect(await prisma.appointment.count()).toBe(53);
    expect(
      await prisma.appointment.count({ where: { mentorId: users.mentorB.id } }),
    ).toBe(PERFORMANCE_APPOINTMENTS);

    const moduleRef = await Test.createTestingModule({
      imports: [AppointmentsModule],
    })
      // Sustituye la conexión por un PrismaClient real, conservando servicios, repositorios y guards.
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(JwtService)
      .useValue(new JwtService({ secret: randomUUID() }))
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();

    for (const key of [
      'mentorA',
      'mentorB',
      'graduate',
      'emptyGraduate',
      'multiRole',
    ] as const) {
      const response = await http()
        .post('/api/auth/login')
        .send({ email: users[key].email, password: SEED_PASSWORD })
        .expect(201);
      expect(response.body.data.accessToken).toEqual(expect.any(String));
      tokens.set(key, response.body.data.accessToken);
    }
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    vi.useRealTimers();
    try {
      await app?.close();
    } finally {
      try {
        await prisma?.$disconnect();
      } finally {
        if (containerCreated)
          await execute('docker', ['rm', '--force', '--volumes', container]);
      }
    }
  }, 30_000);

  it('CA10/V2: returns all 50 appointments in less than 3 seconds per real HTTP request', async () => {
    const expectedIds = seed.plan.blocks
      .filter((block) => block.mentorKey === 'performance')
      .map((block) => block.appointmentId);
    const samples: number[] = [];
    // La primera llamada también cuenta; no hay calentamiento, mocks de consultas ni reintentos.
    for (let sample = 0; sample < 3; sample += 1) {
      const startedAt = performance.now();
      const response = await get(
        'mentorB',
        '/api/appointments/me?scope=upcoming',
      ).expect(200);
      const elapsedMs = performance.now() - startedAt;
      samples.push(elapsedMs);
      expect(elapsedMs).toBeLessThan(RESPONSE_LIMIT_MS);
      expect(response.body).toMatchObject({ statusCode: 200, ok: true });
      const rows = response.body.data as MyAppointmentResponse[];
      expect(rows).toHaveLength(50);
      expect(ids(rows)).toEqual(expectedIds);
      expect(
        rows.every(
          (row) =>
            row.counterpart.id === users.graduate.id &&
            row.status === 'CONFIRMED',
        ),
      ).toBe(true);
    }
    process.stdout.write(
      `HU-06: 50 citas, HTTP + PostgreSQL (ms): ${samples.map((value) => value.toFixed(2)).join(', ')}`,
    );
  }, 15_000);

  it.each(['mentorA', 'graduate'] as const)(
    'CA9/V1: lists only upcoming seeded appointments for %s in chronological order',
    async (user) => {
      const response = await get(
        user,
        '/api/appointments/me?scope=upcoming',
      ).expect(200);
      const expected = seed.plan.blocks
        .filter(
          (block) =>
            block.appointmentId &&
            block.end > now &&
            (user === 'graduate' || block.mentorKey === 'primary'),
        )
        .sort((first, second) => first.start.getTime() - second.start.getTime())
        .map((block) => block.appointmentId);
      const rows = response.body.data as MyAppointmentResponse[];
      expect(ids(rows)).toEqual(expected);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((row) => Date.parse(row.endAt) > now.getTime())).toBe(
        true,
      );
      const defaultScope = await get(user, '/api/appointments/me').expect(200);
      expect(defaultScope.body.data).toEqual(rows);
    },
  );

  it.each(['mentorA', 'graduate'] as const)(
    'CA9/V1: lists past appointments for %s from most recent to oldest',
    async (user) => {
      const confirmed = await prisma!.appointmentStatus.findUniqueOrThrow({
        where: { title: 'CONFIRMED' },
      });
      const extraIds = [randomUUID(), randomUUID()];
      try {
        // Dos registros alrededor de la cita pasada hacen que una inversión del orden falle.
        await prisma!.appointment.createMany({
          data: [-1, 1].map((offset, index) => ({
            id: extraIds[index],
            mentorId: users.mentorA.id,
            studentId: users.graduate.id,
            statusId: confirmed.id,
            startAt: new Date(seed.plan.past.start.getTime() + offset * DAY_MS),
            endAt: new Date(seed.plan.past.end.getTime() + offset * DAY_MS),
          })),
        });
        const response = await get(
          user,
          '/api/appointments/me?scope=past',
        ).expect(200);
        const expected = seed.plan.blocks
          .filter((block) => block.appointmentId && block.end <= now)
          .map((block) => ({
            id: block.appointmentId,
            end: block.end.getTime(),
          }));
        expected.push(
          ...[-1, 1].map((offset, index) => ({
            id: extraIds[index],
            end: seed.plan.past.end.getTime() + offset * DAY_MS,
          })),
        );
        expected.sort((first, second) => second.end - first.end);
        const rows = response.body.data as MyAppointmentResponse[];
        expect(ids(rows)).toEqual(expected.map((row) => row.id));
        expect(
          rows.every((row) => Date.parse(row.endAt) <= now.getTime()),
        ).toBe(true);
      } finally {
        await prisma!.appointment.deleteMany({
          where: { id: { in: extraIds } },
        });
      }
    },
  );

  it.each(['upcoming', 'past'])(
    'returns [] for a seeded graduate without %s appointments',
    async (scope) => {
      const response = await get(
        'emptyGraduate',
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
    'CA9/V1: returns 403 without exposing a foreign appointment to %s',
    async (user) => {
      const response = await get(
        user,
        `/api/appointments/${seed.plan.next.appointmentId}`,
      ).expect(403);
      expect(response.body).toMatchObject({
        statusCode: 403,
        ok: false,
        data: null,
      });
      for (const value of [
        users.mentorA.id,
        users.graduate.id,
        seed.plan.next.appointmentId!,
        seed.plan.next.start.toISOString(),
      ]) {
        expect(JSON.stringify(response.body)).not.toContain(value);
      }
    },
  );

  it('returns identical UTC times, topic and status to both participants with the correct counterpart', async () => {
    const stored = await prisma!.appointment.findUniqueOrThrow({
      where: { id: seed.plan.next.appointmentId },
      include: { mentor: true, student: true, orientationType: true },
    });
    const mentor = await get(
      'mentorA',
      `/api/appointments/${stored.id}`,
    ).expect(200);
    const graduate = await get(
      'graduate',
      `/api/appointments/${stored.id}`,
    ).expect(200);
    const { counterpart: mentorCounterpart, ...mentorData } = mentor.body
      .data as MyAppointmentResponse;
    const { counterpart: graduateCounterpart, ...graduateData } = graduate.body
      .data as MyAppointmentResponse;
    expect(mentorData).toEqual(graduateData);
    expect(mentorData).toEqual({
      id: stored.id,
      blockId: stored.blockId,
      startAt: stored.startAt.toISOString(),
      endAt: stored.endAt.toISOString(),
      orientationType: {
        id: stored.orientationType!.id,
        name: stored.orientationType!.name,
      },
      status: 'CONFIRMED',
    });
    expect(mentorCounterpart).toEqual({
      id: users.graduate.id,
      fullName: 'Titulado Uno',
    });
    expect(graduateCounterpart).toEqual({
      id: users.mentorA.id,
      fullName: 'Mentor Alfa',
    });
    for (const user of ['mentorA', 'graduate'] as const) {
      const list = await get(user, '/api/appointments/me').expect(200);
      const detail = user === 'mentorA' ? mentor : graduate;
      expect(
        list.body.data.find(
          (row: MyAppointmentResponse) => row.id === stored.id,
        ),
      ).toEqual(detail.body.data);
    }
  });

  it('requires a session and rejects attempts to select another user through the query', async () => {
    await http().get('/api/appointments/me').expect(401);
    const response = await get(
      'emptyGraduate',
      `/api/appointments/me?userId=${users.mentorA.id}`,
    ).expect(400);
    expect(response.body.ok).toBe(false);
    const spoofed = await get('emptyGraduate', '/api/appointments/me')
      .set('x-user-id', users.mentorA.id)
      .expect(200);
    expect(spoofed.body.data).toEqual([]);
  });

  it('leaves the original 53 seeded appointments intact after the scenarios', async () => {
    expect(await prisma!.appointment.count()).toBe(53);
    expect(
      await prisma!.appointment.count({
        where: { id: { in: SEED_APPOINTMENT_IDS } },
      }),
    ).toBe(53);
  });
});
