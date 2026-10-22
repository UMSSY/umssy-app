import { Injectable } from '@nestjs/common';
import { toBoliviaTime } from '../../../common/utils/date-time.js';
import { mapRecordNotFound } from '../../../common/utils/map-record-not-found.js';
import { isTransactionTimeoutError } from '../../../common/utils/transaction-timeout.js';
import type { TransactionClient } from '../../../common/types/transaction-client.types.js';
import {
  BlockedDateHasAppointmentException,
  BlockedDateInPastException,
  BlockedDateNotFoundException,
  BlockedDateNotOwnedException,
  DayBlockedException,
  DayBusyException,
} from '../exceptions/index.js';
import { BlockedDateMapper } from '../mappers/blocked-date.mapper.js';
import { BlockedDatesRepository } from '../repositories/blocked-dates.repository.js';
import type { BlockDateDto } from '../requests/block-date.request.js';
import type { WeekQueryDto } from '../requests/week-query.request.js';
import type { BlockedDateResponse } from '../types/blocked-date-response.types.js';
import type { DeletedBlockedDateResponse } from '../types/deleted-blocked-date-response.types.js';
import {
  getBoliviaDayRange,
  getBoliviaToday,
  getLastBoliviaDay,
  toCalendarDate,
  toDayString,
} from '../utils/bolivia-day.js';

@Injectable()
export class BlockedDatesService {
  constructor(
    private readonly blockedDatesRepository: BlockedDatesRepository,
    private readonly blockedDateMapper: BlockedDateMapper,
  ) {}

  async blockDate(mentorId: string, payload: BlockDateDto): Promise<BlockedDateResponse> {
    const { blockedOn: day, reason } = payload;
    if (day < getBoliviaToday()) {
      throw new BlockedDateInPastException();
    }

    const blockedOn = toCalendarDate(day);
    const { startAt, endAt } = getBoliviaDayRange(day);

    return this.inDayLock(mentorId, day, async (tx) => {
      const existing = await this.blockedDatesRepository.findByDay(mentorId, blockedOn, tx);
      if (existing) {
        const current =
          reason && reason !== existing.reason
            ? await this.blockedDatesRepository.updateReason(existing.id, reason, tx)
            : existing;
        return this.blockedDateMapper.toResponse(current);
      }
      if (await this.blockedDatesRepository.hasActiveAppointmentBetween(mentorId, startAt, endAt, tx)) {
        throw new BlockedDateHasAppointmentException();
      }
      const created = await this.blockedDatesRepository.create(mentorId, blockedOn, reason, tx);
      return this.blockedDateMapper.toResponse(created);
    });
  }

  async unblockDate(mentorId: string, id: string): Promise<DeletedBlockedDateResponse> {
    const blockedDate = await this.blockedDatesRepository.findById(id);
    if (!blockedDate) {
      throw new BlockedDateNotFoundException();
    }
    if (blockedDate.mentorId !== mentorId) {
      throw new BlockedDateNotOwnedException();
    }
    await mapRecordNotFound(
      this.blockedDatesRepository.delete(id),
      () => new BlockedDateNotFoundException(),
    );
    return this.blockedDateMapper.toDeletedResponse(blockedDate);
  }

  async findBlockedDates(mentorId: string, query: WeekQueryDto): Promise<BlockedDateResponse[]> {
    const blockedDates = await this.findInRange(mentorId, new Date(query.from), new Date(query.to));
    return this.blockedDateMapper.toResponseList(blockedDates);
  }

  async findBlockedDays(mentorId: string, from: Date, to: Date): Promise<Set<string>> {
    const blockedDates = await this.findInRange(mentorId, from, to);
    return new Set(blockedDates.map((blockedDate) => toDayString(blockedDate.blockedOn)));
  }

  withDayLock<T>(
    mentorId: string,
    day: string,
    work: (tx: TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.inDayLock(mentorId, day, work);
  }

  async assertDayNotBlocked(
    mentorId: string,
    startAt: Date,
    client?: TransactionClient,
  ): Promise<void> {
    const day = toBoliviaTime(startAt).date;
    const blockedDate = await this.blockedDatesRepository.findByDay(
      mentorId,
      toCalendarDate(day),
      client,
    );
    if (blockedDate) {
      throw new DayBlockedException();
    }
  }

  private async inDayLock<T>(
    mentorId: string,
    day: string,
    work: (tx: TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.blockedDatesRepository.withDayLock(mentorId, day, work);
    } catch (error) {
      if (isTransactionTimeoutError(error)) {
        throw new DayBusyException();
      }
      throw error;
    }
  }

  private findInRange(mentorId: string, from: Date, to: Date) {
    return this.blockedDatesRepository.findInRange(
      mentorId,
      toCalendarDate(toBoliviaTime(from).date),
      toCalendarDate(getLastBoliviaDay(to)),
    );
  }
}
