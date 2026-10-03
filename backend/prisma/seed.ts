import 'dotenv/config';

import { pathToFileURL } from 'node:url';

import { PrismaPg } from '@prisma/adapter-pg';
import { Logger } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { z } from 'zod';

import { ROLE_NAMES } from '../src/common/enums/roles.enum.js';
import { buildDatabaseConnectionString } from '../src/common/prisma/build-connection-string.js';
import { addWeeks, getWeekRange, toBoliviaTime } from '../src/common/utils/date-time.js';
import {
  BLOCK_MAX_HOUR,
  BLOCK_MIN_HOUR,
  BLOCK_STEP_MINUTES,
} from '../src/modules/availability/requests/create-block.request.js';
import { PrismaClient } from '../src/prisma/client.js';
import type { AppointmentStatus, Prisma, Role, User } from '../src/prisma/client.js';

export const STATUS_PENDING = 'PENDIENTE';
export const STATUS_CONFIRMED = 'CONFIRMADA';

export type SeedUserKey = 'mentorA' | 'mentorB' | 'graduate' | 'student';

export const SEED_USERS: ReadonlyArray<{
  key: SeedUserKey;
  firstName: string;
  lastName: string;
  email: string;
}> = [
  { key: 'mentorA', firstName: 'Mentor', lastName: 'Alfa', email: 'mentor.a@umssy.test' },
  { key: 'mentorB', firstName: 'Mentor', lastName: 'Beta', email: 'mentor.b@umssy.test' },
  { key: 'graduate', firstName: 'Titulado', lastName: 'Uno', email: 'titulado.1@umssy.test' },
  { key: 'student', firstName: 'Estudiante', lastName: 'Uno', email: 'estudiante.1@umssy.test' },
];

const SEED_EMAILS = SEED_USERS.map((user) => user.email);

const SEED_PASSWORD = 'Prueba123';
const BCRYPT_ROUNDS = 10;

const TEST_USER = {
  email: 'prueba@umss.edu.bo',
  firstName: 'Usuario',
  lastName: 'De Prueba',
};

const LEGACY_ROLES = ['MENTOR', 'TITULADO'];

const EnvSchema = z.object({
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive(),
  DB_SCHEMA: z.string().min(1).optional(),
});

export type SeedEnv = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): SeedEnv {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(raíz)'}: ${issue.message}`)
      .join(' | ');
    throw new Error(`Configuración de base de datos inválida — ${detail}`);
  }
  return parsed.data;
}

export function createSeedClient(env: SeedEnv = loadEnv()): PrismaClient {
  const adapter = new PrismaPg(
    { connectionString: buildDatabaseConnectionString() },
    env.DB_SCHEMA ? { schema: env.DB_SCHEMA } : undefined,
  );
  return new PrismaClient({ adapter });
}

const MS_PER_DAY = 86_400_000;
const MS_PER_MINUTE = 60_000;
const STEP_MS = BLOCK_STEP_MINUTES * MS_PER_MINUTE;

export type WeekRange = { start: Date; end: Date };
export type SeedWeeks = { previous: WeekRange; current: WeekRange; next: WeekRange };

const weekOf = (reference: Date): WeekRange => {
  const range = getWeekRange(reference);
  return { start: new Date(range.startAt), end: new Date(addWeeks(range.startAt, 1)) };
};

export function getWeeks(now: Date = new Date()): SeedWeeks {
  const current = weekOf(now);
  return {
    previous: weekOf(new Date(current.start.getTime() - 7 * MS_PER_DAY)),
    current,
    next: weekOf(new Date(current.start.getTime() + 7 * MS_PER_DAY)),
  };
}

const minutesAt = (hour: number, minute = 0): number => hour * 60 + minute;

const instantAt = (week: WeekRange, day: number, minutesOfDay: number): Date =>
  new Date(week.start.getTime() + day * MS_PER_DAY + minutesOfDay * MS_PER_MINUTE);

export type BlockSeed = { start: Date; end: Date };

const blockAt = (week: WeekRange, day: number, minutesOfDay: number): BlockSeed => {
  const start = instantAt(week, day, minutesOfDay);
  return { start, end: new Date(start.getTime() + STEP_MS) };
};

export function pastBlockRange(week: WeekRange, now: Date): BlockSeed | null {
  const mondayOpen = instantAt(week, 0, minutesAt(BLOCK_MIN_HOUR));
  const mondayClose = new Date(mondayOpen.getTime() + 60 * MS_PER_MINUTE);
  if (now.getTime() >= mondayClose.getTime()) {
    return { start: mondayOpen, end: mondayClose };
  }

  const closedSlotEnd = new Date(Math.floor(now.getTime() / STEP_MS) * STEP_MS);
  const closedSlotStart = new Date(closedSlotEnd.getTime() - STEP_MS);
  if (closedSlotStart.getTime() >= mondayOpen.getTime()) {
    return { start: closedSlotStart, end: closedSlotEnd };
  }

  return null;
}

export type BlockPlan = {
  blocks: BlockSeed[];
  free: BlockSeed;
  pending: BlockSeed;
  confirmed: BlockSeed;
  past: BlockSeed | null;
  trioWeek: WeekRange;
  warnings: string[];
};

const BLOCKS_PER_DAY = 8;

function buildFiftyBlocks(week: WeekRange): BlockSeed[] {
  const blocks: BlockSeed[] = [];
  for (let day = 0; day < 7 && blocks.length < 50; day += 1) {
    const perDay = day < 6 ? BLOCKS_PER_DAY : 2;
    for (let slot = 0; slot < perDay && blocks.length < 50; slot += 1) {
      blocks.push(blockAt(week, day, minutesAt(BLOCK_MIN_HOUR, slot * BLOCK_STEP_MINUTES)));
    }
  }
  return blocks;
}

type TrioPosition = { start: Date; week: WeekRange };

function pickTrio(now: Date, weeks: SeedWeeks): TrioPosition {
  const duration = 3 * STEP_MS;
  const openMinutes = minutesAt(BLOCK_MIN_HOUR);
  const closeMinutes = BLOCK_MAX_HOUR * 60;
  const future = new Date(Math.ceil((now.getTime() + STEP_MS) / STEP_MS) * STEP_MS);

  if (future.getTime() < weeks.current.end.getTime()) {
    const currentDay = Math.floor((future.getTime() - weeks.current.start.getTime()) / MS_PER_DAY);
    for (let day = currentDay; day < 7; day += 1) {
      const dayOpen = instantAt(weeks.current, day, openMinutes);
      const start = new Date(Math.max(future.getTime(), dayOpen.getTime()));
      const { hours, minutes } = toBoliviaTime(start);
      const minutesOfDay = hours * 60 + minutes;
      const fits =
        minutesOfDay + duration / MS_PER_MINUTE <= closeMinutes &&
        start.getTime() + duration <= weeks.current.end.getTime();
      if (fits) {
        return { start, week: weeks.current };
      }
    }
  }

  return { start: instantAt(weeks.next, 0, 14 * 60), week: weeks.next };
}

export function buildBlockPlan(weeks: SeedWeeks, now: Date = new Date()): BlockPlan {
  const warnings: string[] = [];

  const previousWeekBlocks = [
    blockAt(weeks.previous, 1, minutesAt(BLOCK_MIN_HOUR)),
    blockAt(weeks.previous, 1, minutesAt(BLOCK_MIN_HOUR, BLOCK_STEP_MINUTES)),
  ];

  const position = pickTrio(now, weeks);
  const free = { start: position.start, end: new Date(position.start.getTime() + STEP_MS) };
  const pending = {
    start: new Date(free.start.getTime() + STEP_MS),
    end: new Date(free.start.getTime() + 2 * STEP_MS),
  };
  const confirmed = {
    start: new Date(free.start.getTime() + 2 * STEP_MS),
    end: new Date(free.start.getTime() + 3 * STEP_MS),
  };

  const past = pastBlockRange(weeks.current, now);
  if (past === null) {
    warnings.push(
      'Ejecución muy temprana en lunes: no se pudo crear el bloque pasado dentro de la ventana 07:00-22:00 de la semana actual.',
    );
  }
  if (position.week !== weeks.current) {
    warnings.push(
      'La semana actual ya no tiene horario disponible: los bloques de prueba (libre, pendiente y confirmada) se crearon en la semana siguiente.',
    );
  }

  return {
    blocks: [
      ...previousWeekBlocks,
      ...(past === null ? [] : [past]),
      free,
      pending,
      confirmed,
      ...buildFiftyBlocks(weeks.next),
    ],
    free,
    pending,
    confirmed,
    past,
    trioWeek: position.week,
    warnings,
  };
}

type SeedUsers = Record<SeedUserKey, User>;

async function cleanup(tx: Prisma.TransactionClient): Promise<number> {
  const found = await tx.user.findMany({ where: { email: { in: SEED_EMAILS } }, select: { id: true } });
  const ids = found.map((user) => user.id);
  if (ids.length === 0) {
    return 0;
  }

  await tx.appointment.deleteMany({ where: { OR: [{ mentorId: { in: ids } }, { studentId: { in: ids } }] } });
  await tx.availabilityBlock.deleteMany({ where: { mentorId: { in: ids } } });
  await tx.user.deleteMany({ where: { id: { in: ids } } });
  return ids.length;
}

async function seedRoles(tx: Prisma.TransactionClient): Promise<{ mentor: Role; graduate: Role; student: Role }> {
  await tx.role.createMany({ data: ROLE_NAMES.map((name) => ({ name })), skipDuplicates: true });

  const mentor = await tx.role.findUniqueOrThrow({ where: { name: 'mentor' } });
  const graduate = await tx.role.findUniqueOrThrow({ where: { name: 'titulado' } });
  const student = await tx.role.findUniqueOrThrow({ where: { name: 'estudiante' } });

  return { mentor, graduate, student };
}

async function removeLegacyRoles(tx: Prisma.TransactionClient): Promise<number> {
  const legacy = await tx.role.findMany({ where: { name: { in: LEGACY_ROLES } }, select: { id: true } });
  if (legacy.length === 0) {
    return 0;
  }

  const ids = legacy.map((role) => role.id);
  const references = await tx.userRole.count({ where: { roleId: { in: ids } } });
  if (references > 0) {
    return 0;
  }

  const { count } = await tx.role.deleteMany({ where: { id: { in: ids } } });
  return count;
}

async function seedStatuses(
  tx: Prisma.TransactionClient,
): Promise<{ pending: AppointmentStatus; confirmed: AppointmentStatus }> {
  const ensure = (title: string) =>
    tx.appointmentStatus.upsert({ where: { title }, create: { title }, update: {} });

  return { pending: await ensure(STATUS_PENDING), confirmed: await ensure(STATUS_CONFIRMED) };
}

async function seedTestUser(tx: Prisma.TransactionClient, password: string, role: Role): Promise<void> {
  const user = await tx.user.upsert({
    where: { email: TEST_USER.email },
    update: { password },
    create: {
      firstName: TEST_USER.firstName,
      lastName: TEST_USER.lastName,
      email: TEST_USER.email,
      password,
    },
  });

  const assignedRole = await tx.userRole.findFirst({
    where: { userId: user.id, roleId: role.id, deletedAt: null },
  });
  if (!assignedRole) {
    await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
  }
}

async function seedUsers(tx: Prisma.TransactionClient, passwords: string[]): Promise<SeedUsers> {
  await tx.user.createMany({
    data: SEED_USERS.map((user, index) => ({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: passwords[index],
    })),
  });

  const created = await tx.user.findMany({ where: { email: { in: SEED_EMAILS } } });
  const byEmail = new Map(created.map((user) => [user.email, user]));

  return {
    mentorA: byEmail.get(SEED_USERS[0].email) as User,
    mentorB: byEmail.get(SEED_USERS[1].email) as User,
    graduate: byEmail.get(SEED_USERS[2].email) as User,
    student: byEmail.get(SEED_USERS[3].email) as User,
  };
}

async function assignUserRoles(
  tx: Prisma.TransactionClient,
  users: SeedUsers,
  roles: { mentor: Role; graduate: Role; student: Role },
): Promise<number> {
  const { count } = await tx.userRole.createMany({
    data: [
      { userId: users.mentorA.id, roleId: roles.mentor.id },
      { userId: users.mentorB.id, roleId: roles.mentor.id },
      { userId: users.graduate.id, roleId: roles.graduate.id },
      { userId: users.student.id, roleId: roles.student.id },
    ],
  });
  return count;
}

async function seedBlocks(tx: Prisma.TransactionClient, mentorId: string, plan: BlockPlan): Promise<number> {
  const { count } = await tx.availabilityBlock.createMany({
    data: plan.blocks.map((block) => ({ mentorId, startAt: block.start, endAt: block.end })),
  });
  return count;
}

async function seedAppointments(
  tx: Prisma.TransactionClient,
  users: SeedUsers,
  statuses: { pending: AppointmentStatus; confirmed: AppointmentStatus },
  plan: BlockPlan,
): Promise<number> {
  const trioBlocks = await tx.availabilityBlock.findMany({
    where: { mentorId: users.mentorA.id, startAt: { gte: plan.trioWeek.start, lt: plan.trioWeek.end } },
    select: { id: true, startAt: true },
  });
  const idByStart = new Map(trioBlocks.map((block) => [block.startAt.getTime(), block.id]));

  const pendingBlock = idByStart.get(plan.pending.start.getTime());
  const confirmedBlock = idByStart.get(plan.confirmed.start.getTime());
  if (!pendingBlock || !confirmedBlock) {
    throw new Error('No se encontraron los bloques de prueba para crear las citas de la semana del trío.');
  }

  const buildAppointment = (block: BlockSeed, blockId: string, statusId: string, message: string) => ({
    blockId,
    mentorId: users.mentorA.id,
    studentId: users.graduate.id,
    startAt: block.start,
    endAt: block.end,
    statusId,
    message,
  });

  const { count } = await tx.appointment.createMany({
    data: [
      buildAppointment(
        plan.pending,
        pendingBlock,
        statuses.pending.id,
        'Cita de prueba pendiente (seed de desarrollo)',
      ),
      buildAppointment(
        plan.confirmed,
        confirmedBlock,
        statuses.confirmed.id,
        'Cita de prueba confirmada (seed de desarrollo)',
      ),
    ],
  });
  return count;
}

export type SeedSummary = {
  weeks: SeedWeeks;
  plan: BlockPlan;
  roles: number;
  statuses: number;
  users: number;
  userRoles: number;
  blocks: number;
  appointments: number;
  removedUsers: number;
  legacyRoles: number;
  warnings: string[];
};

export async function runSeed(client?: PrismaClient): Promise<SeedSummary> {
  const ownsClient = client === undefined;
  const prisma = client ?? createSeedClient();

  try {
    const now = new Date();
    const weeks = getWeeks(now);
    const plan = buildBlockPlan(weeks, now);
    const passwords = await Promise.all(SEED_USERS.map(() => bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS)));
    const testPassword = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);

    return await prisma.$transaction(
      async (tx) => {
        const removedUsers = await cleanup(tx);
        const roles = await seedRoles(tx);
        const legacyRoles = await removeLegacyRoles(tx);
        const statuses = await seedStatuses(tx);
        await seedTestUser(tx, testPassword, roles.graduate);
        const users = await seedUsers(tx, passwords);
        const userRoles = await assignUserRoles(tx, users, roles);
        const blocks = await seedBlocks(tx, users.mentorA.id, plan);
        const appointments = await seedAppointments(tx, users, statuses, plan);

        return {
          weeks,
          plan,
          roles: ROLE_NAMES.length,
          statuses: Object.keys(statuses).length,
          users: SEED_USERS.length,
          userRoles,
          blocks,
          appointments,
          removedUsers,
          legacyRoles,
          warnings: plan.warnings,
        };
      },
      { maxWait: 5_000, timeout: 30_000 },
    );
  } finally {
    if (ownsClient) {
      await prisma.$disconnect();
    }
  }
}

async function main(): Promise<void> {
  const logger = new Logger('Seed');
  let client: PrismaClient | undefined;

  try {
    client = createSeedClient();
    const summary = await runSeed(client);
    logger.log(
      `Seed completado — roles: ${summary.roles}, estados: ${summary.statuses}, usuarios: ${summary.users}, ` +
        `roles de usuario: ${summary.userRoles}, bloques: ${summary.blocks}, citas: ${summary.appointments}` +
        (summary.removedUsers > 0
          ? ` (re-ejecución: ${summary.removedUsers} usuario(s) de prueba reemplazados)`
          : '') +
        (summary.legacyRoles > 0 ? ` (roles en mayúscula eliminados: ${summary.legacyRoles})` : ''),
    );
    for (const warning of summary.warnings) {
      logger.warn(warning);
    }
  } catch (error) {
    logger.error('El seed falló y la transacción se revirtió', error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
  } finally {
    await client?.$disconnect();
  }
}

const isDirectRun = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  void main();
}
