import { addWeeks, getWeekRange, toBoliviaTime, toUtcIso } from '../../../common/utils/date-time.js';
import type { Prisma } from '../../../prisma/client.js';
import { ACTIVE_APPOINTMENT_STATUSES } from '../constants/appointment-status.constants.js';
import { BLOCK_MAX_HOUR, BLOCK_MIN_HOUR } from '../constants/create-block.constants.js';
import {
  LEGACY_SEED_MESSAGES, MS_PER_DAY, MS_PER_MINUTE, PERFORMANCE_APPOINTMENTS, PRIMARY_APPOINTMENTS, SEED_APPOINTMENT_IDS, SEED_APPOINTMENT_MESSAGE,
  SEED_AVAILABILITY_MESSAGES, SEED_BLOCK_IDS, SEED_BLOCKED_DATE_ID, SEED_BLOCKED_REASON, SEED_SERIES_ID,
  SERIES_OCCURRENCES, STEP_MS,
} from '../constants/seed-availability.constants.js';
import { AppointmentStatusTitle } from '../enums/appointment-status-title.enum.js';
import type { AvailabilitySeedResult } from '../types/availability-seed-result.types.js';
import type { AvailabilitySeedUsers } from '../types/availability-seed-users.types.js';
import type { LegacySeedRecords } from '../types/legacy-seed-records.types.js';
import type { SeedBlockPlan } from '../types/seed-block-plan.types.js';
import type { SeedBlock } from '../types/seed-block.types.js';
import type { SeedWeekRange } from '../types/seed-week-range.types.js';
import type { SeedWeeks } from '../types/seed-weeks.types.js';
import { toCalendarDate } from '../utils/bolivia-day.js';

const weekOf = (reference: Date): SeedWeekRange => {
  const range = getWeekRange(reference);
  return { start: new Date(range.startAt), end: new Date(addWeeks(range.startAt, 1)) };
};

export function getWeeks(now: Date = new Date()): SeedWeeks {
  const current = weekOf(now);
  return {
    previous: weekOf(new Date(addWeeks(current.start, -1))),
    current,
    next: weekOf(current.end),
  };
}

const instantAt = (week: SeedWeekRange, day: number, hour: number): Date =>
  new Date(week.start.getTime() + day * MS_PER_DAY + hour * 60 * MS_PER_MINUTE);

// Los campos PostgreSQL date representan el calendario local, no un instante GMT-4.
const calendarDate = (instant: Date): Date => toCalendarDate(toBoliviaTime(instant).date);

export function buildBlockPlan(weeks: SeedWeeks, now: Date = new Date()): SeedBlockPlan {
  const warnings: string[] = [];
  let currentStart: Date | undefined;
  for (let day = 0; day < 7; day += 1) {
    const open = instantAt(weeks.current, day, BLOCK_MIN_HOUR).getTime();
    const close = instantAt(weeks.current, day, BLOCK_MAX_HOUR).getTime();
    const candidate = Math.max(open, Math.ceil((now.getTime() + 1) / STEP_MS) * STEP_MS);
    if (candidate + STEP_MS <= close) {
      currentStart = new Date(candidate);
      break;
    }
  }
  if (!currentStart) {
    currentStart = instantAt(weeks.current, 6, BLOCK_MAX_HOUR - 0.5);
    warnings.push(SEED_AVAILABILITY_MESSAGES.noFutureSlot);
  }

  const blocks: SeedBlock[] = [];
  const append = (start: Date, mentorKey: SeedBlock['mentorKey'], appointmentIndex?: number): SeedBlock => {
    const block: SeedBlock = {
      id: SEED_BLOCK_IDS[blocks.length], mentorKey, start,
      end: new Date(start.getTime() + STEP_MS),
      ...(appointmentIndex === undefined ? {} : { appointmentId: SEED_APPOINTMENT_IDS[appointmentIndex] }),
    };
    blocks.push(block);
    return block;
  };

  const current = append(currentStart, 'primary', 0);
  // Los horarios de mentor.a quedan fuera de la ventana 07:00-12:00 de mentor.b.
  const next = append(instantAt(weeks.next, 0, 14), 'primary', 1);
  const past = append(instantAt(weeks.previous, 1, 14), 'primary', 2);
  for (let index = 0; index < PERFORMANCE_APPOINTMENTS; index += 1) {
    append(instantAt(weeks.next, Math.floor(index / 10), BLOCK_MIN_HOUR + (index % 10) * 0.5), 'performance', index + PRIMARY_APPOINTMENTS);
  }
  const free = append(instantAt(weeks.next, 0, 15), 'primary');
  const blocked = append(instantAt(weeks.next, 1, 15), 'primary');
  const firstOccurrence = instantAt(weeks.next, 2, 16);
  const repeatUntil = calendarDate(new Date(addWeeks(firstOccurrence, SERIES_OCCURRENCES - 1)));
  for (let index = 0; index < SERIES_OCCURRENCES; index += 1) {
    Object.assign(append(new Date(addWeeks(firstOccurrence, index)), 'primary'), { seriesId: SEED_SERIES_ID, repeatUntil });
  }
  return { blocks, current, next, past, free, blocked, blockedOn: calendarDate(blocked.start), warnings };
}

const mentorOf = (block: SeedBlock, users: AvailabilitySeedUsers): string =>
  block.mentorKey === 'primary' ? users.mentorId : users.performanceMentorId;

const isLegacyAppointment = (
  appointment: { mentorId: string; studentId: string; message: string | null }, users: AvailabilitySeedUsers,
): boolean =>
  appointment.mentorId === users.mentorId && appointment.studentId === users.graduateId &&
  LEGACY_SEED_MESSAGES.includes(appointment.message ?? '');

const overlaps = (start: Date, end: Date, otherStart: Date, otherEnd: Date): boolean =>
  start < otherEnd && end > otherStart;

async function checkReplaceableRecords(
  tx: Prisma.TransactionClient, users: AvailabilitySeedUsers, plan: SeedBlockPlan,
): Promise<void> {
  const existingBlocks = await tx.availabilityBlock.findMany({
    where: { id: { in: SEED_BLOCK_IDS } },
    include: { appointments: { select: { id: true } }, proposals: { select: { id: true } } },
  });
  for (const existing of existingBlocks) {
    const planned = plan.blocks.find((block) => block.id === existing.id)!;
    if (existing.mentorId !== mentorOf(planned, users) || existing.proposals.length > 0 ||
      existing.appointments.some((appointment) => !SEED_APPOINTMENT_IDS.includes(appointment.id))) {
      throw new Error(SEED_AVAILABILITY_MESSAGES.foreignBlock(existing.id));
    }
  }
  const existingAppointments = await tx.appointment.findMany({
    where: { id: { in: SEED_APPOINTMENT_IDS } },
    include: { history: { select: { id: true } }, proposals: { select: { id: true } } },
  });
  for (const existing of existingAppointments) {
    const planned = plan.blocks.find((block) => block.appointmentId === existing.id)!;
    if (existing.mentorId !== mentorOf(planned, users) || existing.studentId !== users.graduateId ||
      existing.blockId !== planned.id || existing.history.length > 0 || existing.proposals.length > 0) {
      throw new Error(SEED_AVAILABILITY_MESSAGES.foreignAppointment(existing.id));
    }
  }
  const existingBlocked = await tx.blockedDate.findUnique({ where: { id: SEED_BLOCKED_DATE_ID } });
  if (existingBlocked && existingBlocked.mentorId !== users.mentorId) {
    throw new Error(SEED_AVAILABILITY_MESSAGES.foreignBlockedDate);
  }
}

// Devuelve lo que dejó el seed anterior para reemplazarlo; cualquier otra colisión detiene el seed.
async function checkForeignCollisions(
  tx: Prisma.TransactionClient, users: AvailabilitySeedUsers, plan: SeedBlockPlan,
): Promise<LegacySeedRecords> {
  const mentorIds = [users.mentorId, users.performanceMentorId];
  const from = new Date(Math.min(...plan.blocks.map((block) => block.start.getTime())));
  const to = new Date(Math.max(...plan.blocks.map((block) => block.end.getTime())));
  const foreignBlocks = await tx.availabilityBlock.findMany({
    where: { id: { notIn: SEED_BLOCK_IDS }, mentorId: { in: mentorIds }, startAt: { lt: to }, endAt: { gt: from } },
    include: {
      appointments: { select: { mentorId: true, studentId: true, message: true } },
      proposals: { select: { id: true } },
    },
  });
  const isReplaceable = (block: (typeof foreignBlocks)[number]): boolean =>
    block.proposals.length === 0 && block.appointments.every((appointment) => isLegacyAppointment(appointment, users));
  const appointmentsInRange = await tx.appointment.findMany({
    where: {
      id: { notIn: SEED_APPOINTMENT_IDS },
      OR: [{ mentorId: { in: mentorIds } }, { studentId: users.graduateId }],
      status: { title: { in: ACTIVE_APPOINTMENT_STATUSES } },
      startAt: { lt: to }, endAt: { gt: from },
    },
  });
  const foreignAppointments = appointmentsInRange.filter((appointment) => !isLegacyAppointment(appointment, users));
  const foreignBlocked = await tx.blockedDate.findMany({
    where: { id: { not: SEED_BLOCKED_DATE_ID }, mentorId: { in: mentorIds } },
  });
  const replaceableBlockIds = new Set<string>();
  for (const block of plan.blocks) {
    const mentorId = mentorOf(block, users);
    const overlapping = foreignBlocks.filter((other) => other.mentorId === mentorId && overlaps(block.start, block.end, other.startAt, other.endAt));
    overlapping.filter(isReplaceable).forEach((other) => replaceableBlockIds.add(other.id));
    if (overlapping.some((other) => !isReplaceable(other)) ||
      foreignAppointments.some((other) => (other.mentorId === mentorId || (block.appointmentId && other.studentId === users.graduateId)) && overlaps(block.start, block.end, other.startAt, other.endAt)) ||
      foreignBlocked.some((other) => other.mentorId === mentorId && other.blockedOn.getTime() === calendarDate(block.start).getTime())) {
      throw new Error(SEED_AVAILABILITY_MESSAGES.collision(block.start.toISOString()));
    }
  }
  const blockedDayStart = new Date(toUtcIso(toBoliviaTime(plan.blocked.start).date, '00:00'));
  const blockedDayEnd = new Date(blockedDayStart.getTime() + MS_PER_DAY);
  if (foreignAppointments.some((other) => other.mentorId === users.mentorId && overlaps(blockedDayStart, blockedDayEnd, other.startAt, other.endAt)) ||
    foreignBlocked.some((other) => other.mentorId === users.mentorId && other.blockedOn.getTime() === plan.blockedOn.getTime())) {
    throw new Error(SEED_AVAILABILITY_MESSAGES.blockedDayBusy);
  }
  const legacyAppointments = await tx.appointment.findMany({
    where: { mentorId: users.mentorId, studentId: users.graduateId, message: { in: LEGACY_SEED_MESSAGES } },
    select: { id: true },
  });
  return { appointmentIds: legacyAppointments.map(({ id }) => id), blockIds: [...replaceableBlockIds] };
}

export async function seedAvailability(
  tx: Prisma.TransactionClient, users: AvailabilitySeedUsers, now: Date = new Date(),
): Promise<AvailabilitySeedResult> {
  if (new Set([users.mentorId, users.performanceMentorId, users.graduateId]).size !== 3) {
    throw new Error(SEED_AVAILABILITY_MESSAGES.sameParticipants);
  }
  const weeks = getWeeks(now);
  const plan = buildBlockPlan(weeks, now);
  await checkReplaceableRecords(tx, users, plan);
  const legacy = await checkForeignCollisions(tx, users, plan);
  const orientation = await tx.orientationType.findFirst({ where: { isActive: true }, orderBy: { name: 'asc' } });
  if (!orientation) {
    throw new Error(SEED_AVAILABILITY_MESSAGES.missingOrientation);
  }
  const statuses = await Promise.all([
    AppointmentStatusTitle.CONFIRMED, AppointmentStatusTitle.CANCELLED, AppointmentStatusTitle.COMPLETED,
  ].map((title) => tx.appointmentStatus.upsert({ where: { title }, create: { title }, update: {} })));
  for (const mentorId of [users.mentorId, users.performanceMentorId]) {
    await tx.mentorOrientationType.upsert({
      where: { mentorId_orientationTypeId: { mentorId, orientationTypeId: orientation.id } },
      create: { mentorId, orientationTypeId: orientation.id }, update: {},
    });
  }

  // Retirar solo el conjunto reservado y lo que dejó el seed anterior evita colisiones transitorias al cambiar de semana.
  // Las comprobaciones previas impiden cascadas o desvinculaciones de referencias ajenas.
  await tx.appointment.deleteMany({ where: { id: { in: [...SEED_APPOINTMENT_IDS, ...legacy.appointmentIds] } } });
  await tx.availabilityBlock.deleteMany({ where: { id: { in: [...SEED_BLOCK_IDS, ...legacy.blockIds] } } });
  await tx.blockedDate.deleteMany({ where: { id: SEED_BLOCKED_DATE_ID } });
  await tx.availabilityBlock.createMany({
    data: plan.blocks.map((block) => ({
      id: block.id, mentorId: mentorOf(block, users), startAt: block.start, endAt: block.end,
      seriesId: block.seriesId, repeatUntil: block.repeatUntil,
    })),
  });
  const appointments = plan.blocks.filter((block) => block.appointmentId);
  await tx.appointment.createMany({
    data: appointments.map((block) => ({
      id: block.appointmentId!, blockId: block.id, mentorId: mentorOf(block, users), studentId: users.graduateId,
      startAt: block.start, endAt: block.end, statusId: statuses[0].id, orientationTypeId: orientation.id,
      message: SEED_APPOINTMENT_MESSAGE, respondedAt: now,
    })),
  });
  await tx.blockedDate.create({
    data: { id: SEED_BLOCKED_DATE_ID, mentorId: users.mentorId, blockedOn: plan.blockedOn, reason: SEED_BLOCKED_REASON },
  });
  return {
    weeks, plan, statuses: statuses.length, blocks: plan.blocks.length, appointments: appointments.length,
    blockedDates: 1, series: 1,
    warnings: legacy.appointmentIds.length + legacy.blockIds.length > 0
      ? [...plan.warnings, SEED_AVAILABILITY_MESSAGES.legacyRemoved(legacy.appointmentIds.length, legacy.blockIds.length)]
      : plan.warnings,
  };
}
