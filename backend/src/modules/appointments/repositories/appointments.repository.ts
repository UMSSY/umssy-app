import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionClient } from '../../../common/types/transaction-client.types.js';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { ACTIVE_APPOINTMENT_STATUS_TITLES } from '../constants/active-appointment-statuses.constants.js';
import { UPCOMING_APPOINTMENT_STATUS_TITLES } from '../constants/upcoming-appointment-statuses.constants.js';
import { PAST_APPOINTMENT_STATUS_TITLES } from '../constants/past-appointment-statuses.constants.js';
import { APPOINTMENT_PARTICIPANT_LOCK_PREFIX } from '../constants/appointment-lock.constants.js';
import { APPOINTMENT_SELECT } from '../constants/appointment-select.constants.js';
import {
  ACCENTED_SEARCH_CHARACTERS,
  UNACCENTED_SEARCH_CHARACTERS,
} from '../constants/my-appointments-search.constants.js';
import { DAILY_APPOINTMENT_LIMIT_STATUS_TITLES } from '../constants/daily-appointment-limit-statuses.constants.js';
import type { BoliviaDayRange } from '../types/bolivia-day-range.types.js';
import type { AppointmentRecord } from '../types/appointment-record.types.js';
import type { CreateAppointmentData } from '../types/create-appointment-data.types.js';
import type { CreateAppointmentHistoryData } from '../types/create-appointment-history-data.types.js';
import type { MyAppointmentsQuery } from '../types/my-appointments-query.types.js';

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findStatusIdByTitle(
    title: AppointmentStatusTitle,
    client: TransactionClient = this.prisma,
  ): Promise<string> {
    const status = await client.appointmentStatus.findUniqueOrThrow({
      where: { title },
      select: { id: true },
    });

    return status.id;
  }

  createAppointment(
    data: CreateAppointmentData,
    client: TransactionClient = this.prisma,
  ): Promise<AppointmentRecord> {
    return client.appointment.create({ data, select: APPOINTMENT_SELECT });
  }

  async createAppointmentHistory(
    data: CreateAppointmentHistoryData,
    client: TransactionClient = this.prisma,
  ): Promise<void> {
    await client.appointmentHistory.create({ data });
  }

  async lockParticipants(
    userIds: string[],
    client: TransactionClient,
  ): Promise<void> {
    const sortedIds = [...new Set(userIds)].sort();

    for (const userId of sortedIds) {
      const key = `${APPOINTMENT_PARTICIPANT_LOCK_PREFIX}${userId}`;
      await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
    }
  }

  async hasOverlappingAppointment(
    userId: string,
    startAt: Date,
    endAt: Date,
    client: TransactionClient = this.prisma,
  ): Promise<boolean> {
    const overlapping = await client.appointment.count({
      where: {
        OR: [{ mentorId: userId }, { studentId: userId }],
        startAt: { lt: endAt },
        endAt: { gt: startAt },
        status: { title: { in: ACTIVE_APPOINTMENT_STATUS_TITLES } },
      },
    });

    return overlapping > 0;
  }

  async hasReservationOnDay(
    userId: string,
    day: BoliviaDayRange,
    client: TransactionClient = this.prisma,
  ): Promise<boolean> {
    const reservations = await client.appointment.count({
      where: {
        studentId: userId,
        startAt: { gte: day.start, lt: day.end },
        status: { title: { in: DAILY_APPOINTMENT_LIMIT_STATUS_TITLES } },
      },
    });

    return reservations > 0;
  }

  async findCounterpartIdsByName(
    userId: string,
    normalizedName: string,
  ): Promise<string[]> {
    const pattern = `%${normalizedName.replace(/[%_\\]/g, '\\$&')}%`;
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT DISTINCT u.id
      FROM appointments a
      JOIN users u ON u.id = CASE
        WHEN a.mentor_id = ${userId}::uuid THEN a.student_id
        ELSE a.mentor_id
      END
      WHERE (a.mentor_id = ${userId}::uuid OR a.student_id = ${userId}::uuid)
        AND translate(
          lower(u.first_name || ' ' || u.last_name),
          ${ACCENTED_SEARCH_CHARACTERS},
          ${UNACCENTED_SEARCH_CHARACTERS}
        ) LIKE ${pattern} ESCAPE '\\'
    `;

    return rows.map((row) => row.id);
  }

  countMine(
    userId: string,
    scope: MyAppointmentsQuery['scope'],
    now: Date,
    counterpartIds?: string[],
  ): Promise<number> {
    return this.prisma.appointment.count({
      where: this.myAppointmentsWhere(userId, scope, now, counterpartIds),
    });
  }

  findMine(
    userId: string,
    scope: MyAppointmentsQuery['scope'],
    now: Date,
    page: number,
    pageSize: number,
    counterpartIds?: string[],
  ): Promise<AppointmentRecord[]> {
    return this.prisma.appointment.findMany({
      where: this.myAppointmentsWhere(userId, scope, now, counterpartIds),
      orderBy:
        scope === 'upcoming'
          ? [{ startAt: 'asc' }, { id: 'asc' }]
          : [{ endAt: 'desc' }, { startAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: APPOINTMENT_SELECT,
    });
  }

  async assignMeetingUrl(
    id: string,
    meetingUrl: string,
  ): Promise<string | null> {
    await this.prisma.appointment.updateMany({
      where: { id, meetingUrl: null },
      data: { meetingUrl },
    });
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      select: { meetingUrl: true },
    });

    return appointment?.meetingUrl ?? null;
  }

  private myAppointmentsWhere(
    userId: string,
    scope: MyAppointmentsQuery['scope'],
    now: Date,
    counterpartIds?: string[],
  ) {
    return {
      OR: counterpartIds
        ? [
            { mentorId: userId, studentId: { in: counterpartIds } },
            { studentId: userId, mentorId: { in: counterpartIds } },
          ]
        : [{ mentorId: userId }, { studentId: userId }],
      endAt: scope === 'upcoming' ? { gt: now } : { lte: now },
      status: {
        title: {
          in:
            scope === 'upcoming'
              ? UPCOMING_APPOINTMENT_STATUS_TITLES
              : PAST_APPOINTMENT_STATUS_TITLES,
        },
      },
    };
  }

  findById(id: string): Promise<AppointmentRecord | null> {
    return this.prisma.appointment.findUnique({
      where: { id },
      select: APPOINTMENT_SELECT,
    });
  }
}
