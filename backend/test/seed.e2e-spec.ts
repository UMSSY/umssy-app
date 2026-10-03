import 'dotenv/config';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createSeedClient,
  getWeeks,
  pastBlockRange,
  runSeed,
  SEED_USERS,
  STATUS_CONFIRMED,
  STATUS_PENDING,
} from '../prisma/seed.js';
import type { SeedSummary } from '../prisma/seed.js';
import { ROLE_NAMES } from '../src/common/enums/roles.enum.js';
import type { PrismaClient } from '../src/prisma/client.js';

const EMAILS = SEED_USERS.map((user) => user.email);
const emailOf = (key: (typeof SEED_USERS)[number]['key']): string =>
  SEED_USERS.find((user) => user.key === key)?.email ?? '';

const TEST_USER_EMAIL = 'prueba@umss.edu.bo';
const LEGACY_ROLES = ['MENTOR', 'TITULADO'];
const WEEK_MS = 7 * 86_400_000;

const initialWeeks = getWeeks(new Date());
const mayHavePastBlock = pastBlockRange(initialWeeks.current, new Date()) !== null;

describe('Seed de desarrollo (e2e)', () => {
  let prisma: PrismaClient;
  let summary: SeedSummary;

  const snapshot = async () => {
    const seeded = await prisma.user.findMany({ where: { email: { in: EMAILS } }, select: { id: true } });
    const ids = seeded.map((user) => user.id);

    return {
      roles: await prisma.role.count(),
      statuses: await prisma.appointmentStatus.count(),
      users: await prisma.user.count({ where: { email: { in: EMAILS } } }),
      userRoles: await prisma.userRole.count({ where: { userId: { in: ids } } }),
      blocks: await prisma.availabilityBlock.count({ where: { mentorId: { in: ids } } }),
      appointments: await prisma.appointment.count({ where: { mentorId: { in: ids } } }),
    };
  };

  beforeAll(async () => {
    prisma = createSeedClient();
    summary = await runSeed(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('crea los usuarios de prueba con los roles en minúscula de ROLE_NAMES', async () => {
    const users = await prisma.user.findMany({
      where: { email: { in: EMAILS } },
      include: { roles: { include: { role: true } } },
    });

    expect(users).toHaveLength(SEED_USERS.length);

    const rolesOf = (email: string) =>
      users.find((user) => user.email === email)?.roles.map((userRole) => userRole.role.name) ?? [];

    expect(rolesOf(emailOf('mentorA'))).toContain('mentor');
    expect(rolesOf(emailOf('mentorB'))).toContain('mentor');
    expect(rolesOf(emailOf('graduate'))).toContain('titulado');
    expect(rolesOf(emailOf('student'))).toContain('estudiante');
  });

  it('deja solo los roles de ROLE_NAMES y elimina los heredados en mayúscula', async () => {
    const found = await prisma.role.findMany({
      where: { name: { in: [...ROLE_NAMES, ...LEGACY_ROLES] } },
    });
    const names = found.map((role) => role.name);

    expect(names).toHaveLength(ROLE_NAMES.length);
    for (const name of ROLE_NAMES) {
      expect(names).toContain(name);
    }
    for (const name of LEGACY_ROLES) {
      expect(names).not.toContain(name);
    }
  });

  it('da contraseña a los cuatro usuarios del seed', async () => {
    const users = await prisma.user.findMany({ where: { email: { in: EMAILS } } });

    expect(users).toHaveLength(SEED_USERS.length);
    for (const user of users) {
      expect(user.password).toBeTruthy();
    }
  });

  it('conserva el usuario provisional de Epic 1 con contraseña y rol titulado', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: TEST_USER_EMAIL } });

    expect(user.password).toBeTruthy();

    const roles = await prisma.userRole.findMany({ where: { userId: user.id }, include: { role: true } });
    expect(roles.map((userRole) => userRole.role.name)).toContain('titulado');
  });

  it('CA2: tiene un bloque libre, uno con cita pendiente y uno con cita confirmada', async () => {
    const { plan } = summary;
    const blocks = await prisma.availabilityBlock.findMany({
      where: { startAt: { gte: plan.trioWeek.start, lt: plan.trioWeek.end } },
      include: { appointments: { include: { status: true } } },
    });

    expect(blocks.length).toBeGreaterThanOrEqual(3);

    const free = blocks.filter((block) => block.appointments.length === 0);
    const withPending = blocks.filter((block) =>
      block.appointments.some((appointment) => appointment.status.title === STATUS_PENDING),
    );
    const withConfirmed = blocks.filter((block) =>
      block.appointments.some((appointment) => appointment.status.title === STATUS_CONFIRMED),
    );

    expect(free.length).toBeGreaterThanOrEqual(1);
    expect(withPending).toHaveLength(1);
    expect(withConfirmed).toHaveLength(1);
  });

  it('CA2/HU-04: libre, pendiente y confirmada están después de la hora de ejecución', async () => {
    const starts = [summary.plan.free, summary.plan.pending, summary.plan.confirmed].map(
      (block) => block.start,
    );
    const blocks = await prisma.availabilityBlock.findMany({ where: { startAt: { in: starts } } });

    expect(blocks).toHaveLength(3);

    const now = Date.now();
    for (const block of blocks) {
      expect(block.startAt.getTime()).toBeGreaterThan(now);
      expect(block.endAt.getTime()).toBeGreaterThan(now);
    }
  });

  it.skipIf(!mayHavePastBlock)('CA2/HU-04: tiene un bloque pasado dentro de la semana actual', async () => {
    const blocks = await prisma.availabilityBlock.findMany({
      where: { startAt: { gte: summary.weeks.current.start, lt: summary.weeks.current.end } },
      select: { endAt: true },
    });

    expect(blocks.some((block) => block.endAt.getTime() < Date.now())).toBe(true);
  });

  it('CA3: un mentor tiene 50 bloques en una semana y el otro no tiene ninguno', async () => {
    const mentorA = await prisma.user.findUniqueOrThrow({ where: { email: emailOf('mentorA') } });
    const mentorB = await prisma.user.findUniqueOrThrow({ where: { email: emailOf('mentorB') } });
    const trioStarts = [summary.plan.free, summary.plan.pending, summary.plan.confirmed].map(
      (block) => block.start,
    );

    const grouped = await prisma.availabilityBlock.groupBy({
      by: ['mentorId'],
      where: {
        mentorId: { in: [mentorA.id, mentorB.id] },
        startAt: {
          gte: summary.weeks.next.start,
          lt: summary.weeks.next.end,
          notIn: trioStarts,
        },
      },
      _count: { _all: true },
    });

    const blocksOf = (mentorId: string): number =>
      grouped.find((group) => group.mentorId === mentorId)?._count._all ?? 0;

    expect(blocksOf(mentorA.id)).toBe(50);
    expect(blocksOf(mentorB.id)).toBe(0);
  });

  it('CA4: correr el seed dos veces no duplica datos', async () => {
    const before = await snapshot();
    await runSeed(prisma);
    const after = await snapshot();

    expect(after).toEqual(before);
    expect(after.users).toBe(SEED_USERS.length);
    expect(after.blocks).toBeGreaterThanOrEqual(55);
    expect(after.appointments).toBe(2);
  });

  it('getWeeks mantiene el domingo 21:00 y 23:30 de Bolivia en la semana actual', () => {
    const lateSundays = [new Date('2026-10-05T01:00:00.000Z'), new Date('2026-10-05T03:30:00.000Z')];

    for (const instant of lateSundays) {
      const weeks = getWeeks(instant);

      expect(weeks.current.start.getTime()).toBeLessThanOrEqual(instant.getTime());
      expect(instant.getTime()).toBeLessThan(weeks.current.end.getTime());
      expect(weeks.current.end.getTime() - weeks.current.start.getTime()).toBe(WEEK_MS);
      expect(weeks.current.start.getUTCDay()).toBe(1);
    }
  });
});
