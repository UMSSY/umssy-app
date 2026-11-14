import { randomUUID } from 'node:crypto';
import { FixtureContext } from '../../../../common/database/fixture-context.js';
import { ACTIVE_APPOINTMENT_STATUSES } from '../../../availability/constants/appointment-status.constants.js';
import { FIXTURE_APPOINTMENT_STATUSES } from '../../../availability/constants/seed-fixture-appointments.constants.js';
import { AppointmentStatusTitle } from '../../../availability/enums/appointment-status-title.enum.js';
import { buildAppointmentFixtures } from '../../../availability/seeds/appointments-fixtures.seed.js';
import { buildAvailabilityBlockFixtures } from '../../../availability/seeds/availability-blocks-fixtures.seed.js';
import type { AvailabilityBlockWithAppointments } from '../../../availability/types/availability-block-with-appointments.types.js';
import { SEED_ORIENTATION_TYPES } from '../../../orientation-types/constants/seed-orientation-types.constants.js';
import {
  FIXTURE_MENTORS,
  FIXTURE_USERS,
} from '../../../users/constants/seed-fixture-users.constants.js';
import { ACTIVE_APPOINTMENT_STATUS_TITLES } from '../../constants/active-appointment-statuses.constants.js';
import { DAILY_APPOINTMENT_LIMIT_STATUS_TITLES } from '../../constants/daily-appointment-limit-statuses.constants.js';
import { PAST_APPOINTMENT_STATUS_TITLES } from '../../constants/past-appointment-statuses.constants.js';
import { UPCOMING_APPOINTMENT_STATUS_TITLES } from '../../constants/upcoming-appointment-statuses.constants.js';
import type { BoliviaDayRange } from '../../types/bolivia-day-range.types.js';
import type { AppointmentRecord } from '../../types/appointment-record.types.js';
import type { CreateAppointmentData } from '../../types/create-appointment-data.types.js';
import type { CreateAppointmentHistoryData } from '../../types/create-appointment-history-data.types.js';
import type { MyAppointmentsQuery } from '../../types/my-appointments-query.types.js';

export const OVERLAP_HTTP_ANCHOR = new Date('2026-11-16T15:00:00.000Z');

export const OVERLAP_TOPIC = {
  id: '66666666-6666-4666-8666-666666666666',
  name: SEED_ORIENTATION_TYPES[0].name,
  description: SEED_ORIENTATION_TYPES[0].description,
} as const;

export interface InMemoryBlock {
  id: string;
  mentorId: string;
  startAt: Date;
  endAt: Date;
  seriesId: string | null;
  repeatUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryBlockedDate {
  id: string;
  mentorId: string;
  blockedOn: Date;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddAppointmentInput {
  mentorId: string;
  studentId: string;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatusTitle;
  blockId?: string;
}

export interface TestTransaction {
  readonly releases: Array<() => void>;
}

const STATUS_TITLES = [
  AppointmentStatusTitle.CONFIRMED,
  AppointmentStatusTitle.LEGACY_CONFIRMED,
  AppointmentStatusTitle.LEGACY_PENDING,
  AppointmentStatusTitle.LEGACY_CANCELLED,
  AppointmentStatusTitle.LEGACY_COMPLETED,
  AppointmentStatusTitle.CANCELLED,
  AppointmentStatusTitle.COMPLETED,
  AppointmentStatusTitle.LEGACY_COMPLETED,
  AppointmentStatusTitle.LEGACY_CANCELLED,
  'RECHAZADA',
] as const;

const ADMIN_ID = '00000000-0000-4000-8000-000000000000';

/**
 * Seed en memoria para las pruebas HTTP de citas.
 * Reutiliza los usuarios, catálogos y bloques del seed de desarrollo.
 */
export class InMemoryOverlapSeed {
  private readonly users = new Map<
    string,
    (typeof FIXTURE_USERS)[number] & { id: string }
  >();
  private readonly blocks: InMemoryBlock[];
  private readonly appointments: AppointmentRecord[] = [];
  private readonly histories: CreateAppointmentHistoryData[] = [];
  private readonly statusIdByTitle = new Map<string, string>();
  private readonly statusTitleById = new Map<string, string>();
  private readonly orientationNameById = new Map<string, string>();
  private readonly locks = new Map<string, Promise<void>>();
  private readonly dayLocks = new Map<string, Promise<void>>();
  private readonly availabilityByMentor = new Map<string, boolean>();
  private readonly blockedDates: InMemoryBlockedDate[] = [];
  private readonly context: FixtureContext;

  constructor() {
    this.context = new FixtureContext(OVERLAP_HTTP_ANCHOR, ADMIN_ID);

    for (const user of FIXTURE_USERS) {
      const id = this.context.getId(user.key);
      this.users.set(id, {
        ...user,
        id,
      });
      this.availabilityByMentor.set(id, true);
    }

    for (const status of STATUS_TITLES) {
      const id = this.context.getId(`appointment-status:${status}`);
      this.statusIdByTitle.set(status, id);
      this.statusTitleById.set(id, status);
    }

    for (const orientation of SEED_ORIENTATION_TYPES) {
      const id = this.context.getId(`orientation-type:${orientation.name}`);
      this.context.setReference('orientation_types', orientation.name, id);
      this.orientationNameById.set(id, orientation.name);
    }

    for (const status of FIXTURE_APPOINTMENT_STATUSES) {
      this.context.setReference(
        'appointment_statuses',
        status,
        this.context.getId(`appointment-status:${status}`),
      );
    }

    this.blocks = buildAvailabilityBlockFixtures(this.context).map((block) => ({
      id: block.id,
      mentorId: block.mentorId,
      startAt: block.startAt,
      endAt: block.endAt,
      seriesId: block.seriesId,
      repeatUntil: block.repeatUntil,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
    }));

    for (const appointment of buildAppointmentFixtures(this.context)) {
      this.appointments.push(
        this.toRecord({
          id: appointment.id,
          blockId: appointment.blockId,
          mentorId: appointment.mentorId,
          studentId: appointment.studentId,
          startAt: appointment.startAt,
          endAt: appointment.endAt,
          message: appointment.message,
          requestedAt: appointment.requestedAt,
          statusId: appointment.statusId,
          orientationTypeId: appointment.orientationTypeId,
          meetingUrl: appointment.meetingUrl,
        }),
      );
    }
  }

  get studentId(): string {
    return this.context.getId(FIXTURE_USERS[5].key);
  }

  get dualMentorId(): string {
    return this.mentorIdAt(0);
  }

  mentorIdAt(mentorIndex: number): string {
    return this.context.getId(FIXTURE_MENTORS[mentorIndex].key);
  }

  userIdAt(userIndex: number): string {
    const user = FIXTURE_USERS[userIndex];
    if (!user) {
      throw new Error(`No existe el usuario ${userIndex}`);
    }
    return this.context.getId(user.key);
  }

  seededAppointmentFor(
    mentorIndex: number,
    status: AppointmentStatusTitle = AppointmentStatusTitle.LEGACY_CONFIRMED,
  ): AppointmentRecord {
    const mentorId = this.mentorIdAt(mentorIndex);
    const appointment = this.appointments.find(
      (item) => item.mentorId === mentorId && item.status.title === status,
    );
    if (!appointment) {
      throw new Error(
        `No existe una cita ${status} del mentor ${mentorIndex}`,
      );
    }
    return appointment;
  }

  blockFor(mentorIndex: number, slotIndex: number): InMemoryBlock {
    const blocks = this.blocks.filter(
      (block) => block.mentorId === this.mentorIdAt(mentorIndex),
    );
    const block = blocks[slotIndex];
    if (!block) {
      throw new Error(
        `No existe el bloque ${slotIndex} del mentor ${mentorIndex}`,
      );
    }
    return block;
  }

  addBlock(mentorId: string, startAt: Date, endAt: Date): InMemoryBlock {
    const block: InMemoryBlock = {
      id: randomUUID(),
      mentorId,
      startAt,
      endAt,
      seriesId: null,
      repeatUntil: null,
      createdAt: OVERLAP_HTTP_ANCHOR,
      updatedAt: OVERLAP_HTTP_ANCHOR,
    };
    this.blocks.push(block);
    return block;
  }

  addAppointment(input: AddAppointmentInput): AppointmentRecord {
    const record = this.toRecord({
      id: randomUUID(),
      blockId: input.blockId ?? randomUUID(),
      mentorId: input.mentorId,
      studentId: input.studentId,
      startAt: input.startAt,
      endAt: input.endAt,
      message: 'Cita del seed en memoria',
      requestedAt: OVERLAP_HTTP_ANCHOR,
      statusId:
        this.statusIdByTitle.get(input.status) ??
        this.context.getId(`appointment-status:${input.status}`),
      orientationTypeId: OVERLAP_TOPIC.id,
    });
    this.appointments.push(record);
    return record;
  }

  countAppointmentsOf(userId: string): number {
    return this.appointments.filter(
      (appointment) =>
        appointment.studentId === userId || appointment.mentorId === userId,
    ).length;
  }

  nameOf(userId: string): string {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`No existe el usuario ${userId}`);
    }
    return `${user.firstName} ${user.lastName}`;
  }

  historiesOf(appointmentId: string): CreateAppointmentHistoryData[] {
    return this.histories.filter(
      (history) => history.appointmentId === appointmentId,
    );
  }

  get appointmentsRepository() {
    return {
      findStatusIdByTitle: (title: AppointmentStatusTitle) => {
        const id = this.statusIdByTitle.get(title);
        if (!id) {
          throw new Error(`No existe el estado ${title}`);
        }
        return Promise.resolve(id);
      },
      createAppointment: (data: CreateAppointmentData) =>
        Promise.resolve(this.createAppointment(data)),
      assignMeetingUrl: (id: string, meetingUrl: string) => {
        const appointment = this.appointments.find((item) => item.id === id);
        if (!appointment) {
          return Promise.resolve(null);
        }
        appointment.meetingUrl ??= meetingUrl;
        return Promise.resolve(appointment.meetingUrl);
      },
      createAppointmentHistory: (data: CreateAppointmentHistoryData) => {
        this.histories.push(data);
        return Promise.resolve();
      },
      lockParticipants: (
        userIds: string[],
        transaction: TestTransaction,
      ): Promise<void> => this.lockParticipants(userIds, transaction),
      hasOverlappingAppointment: (userId: string, startAt: Date, endAt: Date) =>
        Promise.resolve(this.hasOverlapping(userId, startAt, endAt)),
      hasReservationOnDay: (userId: string, day: BoliviaDayRange) =>
        Promise.resolve(this.hasReservationOnDay(userId, day)),
      countMine: (
        userId: string,
        scope: MyAppointmentsQuery['scope'],
        now: Date,
      ) => Promise.resolve(this.mineAppointments(userId, scope, now).length),
      findMine: (
        userId: string,
        scope: MyAppointmentsQuery['scope'],
        now: Date,
        page: number,
        pageSize: number,
      ) =>
        Promise.resolve(
          this.mineAppointments(userId, scope, now).slice(
            (page - 1) * pageSize,
            page * pageSize,
          ),
        ),
      findById: (id: string) =>
        Promise.resolve(
          this.appointments.find((appointment) => appointment.id === id) ??
            null,
        ),
    };
  }

  get availabilityRepository() {
    return {
      findById: (
        blockId: string,
      ): Promise<AvailabilityBlockWithAppointments | null> => {
        const block = this.blocks.find((item) => item.id === blockId);
        if (!block) {
          return Promise.resolve(null);
        }
        return Promise.resolve({
          ...block,
          appointments: this.activeAppointmentsOf(blockId).map(
            (appointment) => ({ status: { title: appointment.status.title } }),
          ),
        } as AvailabilityBlockWithAppointments);
      },
      delete: (blockId: string): Promise<InMemoryBlock> => {
        const index = this.blocks.findIndex((item) => item.id === blockId);
        const block = this.blocks[index];
        if (!block) {
          return Promise.reject(new Error(`No existe el bloque ${blockId}`));
        }
        this.blocks.splice(index, 1);
        return Promise.resolve(block);
      },
      findMentorFreeBlocksInRange: (
        mentorId: string,
        from: Date,
        to: Date,
      ): Promise<AvailabilityBlockWithAppointments[]> =>
        Promise.resolve(this.freeBlocksInRange(mentorId, from, to)),
    };
  }

  get sessionRepository() {
    return {
      findUserById: (id: string) => {
        const user = this.users.get(id);
        if (!user) {
          return Promise.resolve(null);
        }
        return Promise.resolve({
          id: user.id,
          email: `${user.number}@umssy.test`,
          company: null,
          isActive: user.isActive,
          roles: user.roles.map((role) => ({ role: { name: role } })),
        });
      },
    };
  }

  get mentorsService() {
    return {
      findOne: (id: string) =>
        Promise.resolve({
          id,
          isAvailable: this.availabilityByMentor.get(id) ?? true,
          orientationTypes: [OVERLAP_TOPIC],
        }),
      updateAvailability: (id: string, isAvailable: boolean) => {
        this.availabilityByMentor.set(id, isAvailable);
        return Promise.resolve({ id, isAvailableForMentoring: isAvailable });
      },
    };
  }

  get blockedDatesRepository() {
    return {
      withDayLock: <T>(
        mentorId: string,
        day: string,
        work: (transaction: TestTransaction) => Promise<T>,
      ): Promise<T> => this.withDayLock(mentorId, day, work),
      findByDay: (
        mentorId: string,
        blockedOn: Date,
      ): Promise<InMemoryBlockedDate | null> =>
        Promise.resolve(
          this.blockedDates.find(
            (item) =>
              item.mentorId === mentorId &&
              item.blockedOn.getTime() === blockedOn.getTime(),
          ) ?? null,
        ),
      findById: (id: string): Promise<InMemoryBlockedDate | null> =>
        Promise.resolve(
          this.blockedDates.find((item) => item.id === id) ?? null,
        ),
      findInRange: (
        mentorId: string,
        fromDay: Date,
        toDay?: Date,
      ): Promise<InMemoryBlockedDate[]> =>
        Promise.resolve(
          this.blockedDates
            .filter(
              (item) =>
                item.mentorId === mentorId &&
                item.blockedOn.getTime() >= fromDay.getTime() &&
                (!toDay || item.blockedOn.getTime() <= toDay.getTime()),
            )
            .sort(
              (left, right) =>
                left.blockedOn.getTime() - right.blockedOn.getTime(),
            ),
        ),
      hasActiveAppointmentBetween: (
        mentorId: string,
        from: Date,
        to: Date,
      ): Promise<boolean> =>
        Promise.resolve(
          this.blocks.some(
            (block) =>
              block.mentorId === mentorId &&
              block.startAt.getTime() >= from.getTime() &&
              block.startAt.getTime() < to.getTime() &&
              this.activeAppointmentsOf(block.id).length > 0,
          ),
        ),
      create: (
        mentorId: string,
        blockedOn: Date,
        reason: string | null,
      ): Promise<InMemoryBlockedDate> =>
        Promise.resolve(this.createBlockedDate(mentorId, blockedOn, reason)),
      updateReason: (
        id: string,
        reason: string,
      ): Promise<InMemoryBlockedDate> => {
        const blockedDate = this.blockedDates.find((item) => item.id === id);
        if (!blockedDate) {
          return Promise.reject(
            new Error(`No existe la fecha bloqueada ${id}`),
          );
        }
        blockedDate.reason = reason;
        blockedDate.updatedAt = new Date();
        return Promise.resolve(blockedDate);
      },
      delete: (id: string): Promise<InMemoryBlockedDate> => {
        const index = this.blockedDates.findIndex((item) => item.id === id);
        const blockedDate = this.blockedDates[index];
        if (!blockedDate) {
          return Promise.reject(
            new Error(`No existe la fecha bloqueada ${id}`),
          );
        }
        this.blockedDates.splice(index, 1);
        return Promise.resolve(blockedDate);
      },
    };
  }

  get blockedDatesService() {
    return {
      runOnUnblockedDay: async <T>(
        _mentorId: string,
        _startAt: Date,
        work: (transaction: TestTransaction) => Promise<T>,
      ): Promise<T> => {
        const transaction: TestTransaction = { releases: [] };
        try {
          return await work(transaction);
        } finally {
          for (const release of transaction.releases) {
            release();
          }
        }
      },
    };
  }

  private createAppointment(data: CreateAppointmentData): AppointmentRecord {
    const record = this.toRecord({
      id: randomUUID(),
      blockId: data.blockId,
      mentorId: data.mentorId,
      studentId: data.studentId,
      startAt: data.startAt,
      endAt: data.endAt,
      message: data.message ?? null,
      requestedAt: new Date(),
      statusId: data.statusId,
      orientationTypeId: data.orientationTypeId,
      meetingUrl: data.meetingUrl,
    });
    this.appointments.push(record);
    return record;
  }

  private toRecord(input: {
    id: string;
    blockId: string;
    mentorId: string;
    studentId: string;
    startAt: Date;
    endAt: Date;
    message: string | null;
    requestedAt: Date;
    statusId: string;
    orientationTypeId: string;
    meetingUrl?: string | null;
  }): AppointmentRecord {
    return {
      id: input.id,
      blockId: input.blockId,
      mentorId: input.mentorId,
      studentId: input.studentId,
      startAt: input.startAt,
      endAt: input.endAt,
      message: input.message,
      requestedAt: input.requestedAt,
      meetingUrl: input.meetingUrl ?? null,
      cancelledById: null,
      cancellationReason: null,
      cancelledAt: null,
      mentor: this.userBrief(input.mentorId),
      student: this.userBrief(input.studentId),
      orientationType: {
        id: input.orientationTypeId,
        name:
          this.orientationNameById.get(input.orientationTypeId) ??
          OVERLAP_TOPIC.name,
      },
      status: {
        title:
          this.statusTitleById.get(input.statusId) ??
          AppointmentStatusTitle.CONFIRMED,
      },
      document: null,
    };
  }

  private userBrief(userId: string) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`No existe el usuario ${userId}`);
    }
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  private activeAppointmentsOf(blockId: string): AppointmentRecord[] {
    return this.appointments.filter(
      (appointment) =>
        appointment.blockId === blockId &&
        ACTIVE_APPOINTMENT_STATUSES.includes(
          appointment.status.title as AppointmentStatusTitle,
        ),
    );
  }

  private mineAppointments(
    userId: string,
    scope: MyAppointmentsQuery['scope'],
    now: Date,
  ): AppointmentRecord[] {
    const titles: readonly string[] =
      scope === 'upcoming'
        ? UPCOMING_APPOINTMENT_STATUS_TITLES
        : PAST_APPOINTMENT_STATUS_TITLES;
    const byTime = (appointment: AppointmentRecord) =>
      scope === 'upcoming'
        ? appointment.endAt.getTime() > now.getTime()
        : appointment.endAt.getTime() <= now.getTime();

    return this.appointments
      .filter(
        (appointment) =>
          (appointment.mentorId === userId ||
            appointment.studentId === userId) &&
          titles.includes(appointment.status.title) &&
          byTime(appointment),
      )
      .sort((a, b) =>
        scope === 'upcoming'
          ? a.startAt.getTime() - b.startAt.getTime() ||
            a.id.localeCompare(b.id)
          : b.endAt.getTime() - a.endAt.getTime() ||
            b.startAt.getTime() - a.startAt.getTime() ||
            a.id.localeCompare(b.id),
      );
  }

  private hasOverlapping(userId: string, startAt: Date, endAt: Date): boolean {
    return this.appointments.some(
      (appointment) =>
        (appointment.mentorId === userId || appointment.studentId === userId) &&
        appointment.startAt.getTime() < endAt.getTime() &&
        appointment.endAt.getTime() > startAt.getTime() &&
        ACTIVE_APPOINTMENT_STATUS_TITLES.includes(
          appointment.status.title as AppointmentStatusTitle,
        ),
    );
  }

  private hasReservationOnDay(userId: string, day: BoliviaDayRange): boolean {
    return this.appointments.some(
      (appointment) =>
        appointment.studentId === userId &&
        appointment.startAt.getTime() >= day.start.getTime() &&
        appointment.startAt.getTime() < day.end.getTime() &&
        DAILY_APPOINTMENT_LIMIT_STATUS_TITLES.includes(
          appointment.status.title as AppointmentStatusTitle,
        ),
    );
  }

  private freeBlocksInRange(
    mentorId: string,
    from: Date,
    to: Date,
  ): AvailabilityBlockWithAppointments[] {
    return this.blocks
      .filter(
        (block) =>
          block.mentorId === mentorId &&
          block.startAt.getTime() >= from.getTime() &&
          block.startAt.getTime() < to.getTime() &&
          this.activeAppointmentsOf(block.id).length === 0,
      )
      .sort((left, right) => left.startAt.getTime() - right.startAt.getTime())
      .map(
        (block) =>
          ({
            ...block,
            appointments: [],
          }) as AvailabilityBlockWithAppointments,
      );
  }

  private createBlockedDate(
    mentorId: string,
    blockedOn: Date,
    reason: string | null,
  ): InMemoryBlockedDate {
    const blockedDate: InMemoryBlockedDate = {
      id: randomUUID(),
      mentorId,
      blockedOn,
      reason,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.blockedDates.push(blockedDate);
    return blockedDate;
  }

  private async withDayLock<T>(
    mentorId: string,
    day: string,
    work: (transaction: TestTransaction) => Promise<T>,
  ): Promise<T> {
    const key = `${mentorId}:${day}`;
    const previous = this.dayLocks.get(key) ?? Promise.resolve();
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const tail = previous.then(() => held);
    this.dayLocks.set(key, tail);
    await previous;
    const transaction: TestTransaction = { releases: [] };
    transaction.releases.push(() => {
      release();
      if (this.dayLocks.get(key) === tail) {
        this.dayLocks.delete(key);
      }
    });
    try {
      return await work(transaction);
    } finally {
      for (const releaseLock of transaction.releases) {
        releaseLock();
      }
    }
  }

  private async lockParticipants(
    userIds: string[],
    transaction: TestTransaction,
  ): Promise<void> {
    for (const userId of [...new Set(userIds)].sort()) {
      const previous = this.locks.get(userId) ?? Promise.resolve();
      let release: () => void = () => undefined;
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      const tail = previous.then(() => held);
      this.locks.set(userId, tail);
      await previous;
      transaction.releases.push(() => {
        release();
        if (this.locks.get(userId) === tail) {
          this.locks.delete(userId);
        }
      });
    }
  }
}
