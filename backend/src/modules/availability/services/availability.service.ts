import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AvailabilityRepository } from '../repositories/availability.repository.js';
import { AvailabilityMapper } from '../mappers/availability.mapper.js';
import {
  BlockHasAppointmentException,
  BlockNotFoundException,
  BlockNotOwnedException,
  BlockOverlapException,
  DayBlockedException,
  MentorAvailabilityNotOwnedException,
} from '../exceptions/index.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { toBoliviaTime } from '../../../common/utils/date-time.js';
import type { TransactionClient } from '../../../common/types/transaction-client.types.js';
import { BlockedDatesService } from './blocked-dates.service.js';
import { hasOverlapErrorCode } from '../utils/overlap-error.js';
import type { AvailabilityBlockResponse } from '../types/availability-block-response.types.js';
import type { CreateBlockDto } from '../requests/create-block.request.js';
import type { WeekQueryDto } from '../requests/week-query.request.js';
import type { DeletedBlockResponse } from '../types/deleted-block-response.types.js';
import type { UpdateBlockDto } from '../requests/update-block.request.js';
import type { MentorAvailabilityStatusResponse } from '../types/mentor-availability-status-response.types.js';
import type { WeeklyRepeatResponse } from '../types/weekly-repeat-response.types.js';
import { weeklyOccurrences } from '../utils/weekly-occurrences.js';
import { splitIntoBlocks } from '../utils/split-into-blocks.js';
import type { BlockSlot } from '../types/block-slot.types.js';
import type { BlockSeriesData } from '../types/block-series-data.types.js';
import type { AvailabilityBlock } from '../../../prisma/client.js';
import { toCalendarDate } from '../utils/bolivia-day.js';
import type { OwnerAvailabilityBlockResponse } from '../types/owner-availability-block-response.types.js';
import type { AvailabilityBlockWithAppointments } from '../types/availability-block-with-appointments.types.js';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly availabilityRepository: AvailabilityRepository,
    private readonly availabilityMapper: AvailabilityMapper,
    private readonly mentorsService: MentorsService,
    private readonly blockedDatesService: BlockedDatesService,
  ) {}

  findBlockWithAppointments(
    blockId: string,
    client?: TransactionClient,
  ): Promise<AvailabilityBlockWithAppointments | null> {
    return this.availabilityRepository.findById(blockId, client);
  }

  async remove(
    mentorId: string,
    blockId: string,
  ): Promise<DeletedBlockResponse> {
    const block = await this.availabilityRepository.findById(blockId);
    if (!block) {
      throw new BlockNotFoundException();
    }
    if (block.mentorId !== mentorId) {
      throw new BlockNotOwnedException();
    }
    if (block.appointments.length > 0) {
      throw new BlockHasAppointmentException();
    }
    // TODO: impedir eliminar el bloque si tiene propuestas activas (Sprint 2)
    await this.availabilityRepository.delete(blockId);
    return this.availabilityMapper.toDeletedResponse(block);
  }

  async findMyBlocks(
    mentorId: string,
    query: WeekQueryDto,
  ): Promise<OwnerAvailabilityBlockResponse[]> {
    const blocks = await this.availabilityRepository.findMentorBlocksInRange(
      mentorId,
      new Date(query.from),
      new Date(query.to),
    );
    return this.availabilityMapper.toOwnerResponseList(blocks);
  }

  async updateBlock(
    mentorId: string,
    blockId: string,
    payload: UpdateBlockDto,
  ): Promise<AvailabilityBlockResponse> {
    const block = await this.availabilityRepository.findById(blockId);

    if (!block) {
      throw new BlockNotFoundException();
    }
    if (block.mentorId !== mentorId) {
      throw new BlockNotOwnedException();
    }
    if (block.appointments.length > 0) {
      throw new BlockHasAppointmentException();
    }

    const save = (tx?: TransactionClient) =>
      this.availabilityRepository.update(
        blockId,
        { startAt: payload.startAt, endAt: payload.endAt },
        tx,
      );
    const movesToAnotherDay =
      toBoliviaTime(block.startAt).date !== toBoliviaTime(payload.startAt).date;

    try {
      const updated = movesToAnotherDay
        ? await this.blockedDatesService.runOnUnblockedDay(
            mentorId,
            payload.startAt,
            save,
          )
        : await save();
      return this.availabilityMapper.toResponse(updated);
    } catch (error) {
      if (hasOverlapErrorCode(error)) {
        throw new BlockOverlapException();
      }
      throw error;
    }
  }

  async create(
    mentorId: string,
    payload: CreateBlockDto,
  ): Promise<AvailabilityBlockResponse | WeeklyRepeatResponse> {
    if (payload.repeatWeekly && payload.repeatUntil !== undefined) {
      return this.createWeeklySeries(mentorId, payload, payload.repeatUntil);
    }
    try {
      const blocks = await this.blockedDatesService.runOnUnblockedDay(
        mentorId,
        payload.startAt,
        (tx) =>
          this.createSlots(
            mentorId,
            splitIntoBlocks(payload.startAt, payload.endAt),
            tx,
          ),
      );
      if (blocks.length > 1) {
        return { created: blocks.length, skipped: [] };
      }
      return this.availabilityMapper.toResponse({
        ...blocks[0],
        appointments: [],
      });
    } catch (error) {
      if (hasOverlapErrorCode(error)) {
        throw new BlockOverlapException();
      }
      throw error;
    }
  }

  private async createSlots(
    mentorId: string,
    slots: BlockSlot[],
    tx: TransactionClient,
    series?: BlockSeriesData,
  ): Promise<AvailabilityBlock[]> {
    const blocks: AvailabilityBlock[] = [];
    for (const slot of slots) {
      blocks.push(
        await this.availabilityRepository.create(
          mentorId,
          slot.startAt,
          slot.endAt,
          tx,
          series,
        ),
      );
    }
    return blocks;
  }

  private async createWeeklySeries(
    mentorId: string,
    payload: CreateBlockDto,
    repeatUntil: string,
  ): Promise<WeeklyRepeatResponse> {
    const series = {
      seriesId: randomUUID(),
      repeatUntil: toCalendarDate(repeatUntil),
    };
    const result: WeeklyRepeatResponse = { created: 0, skipped: [] };

    for (const occurrence of weeklyOccurrences(
      payload.startAt,
      payload.endAt,
      repeatUntil,
    )) {
      try {
        const blocks = await this.blockedDatesService.runOnUnblockedDay(
          mentorId,
          occurrence.startAt,
          (tx) =>
            this.createSlots(
              mentorId,
              splitIntoBlocks(occurrence.startAt, occurrence.endAt),
              tx,
              series,
            ),
        );
        result.created += blocks.length;
      } catch (error) {
        if (
          error instanceof DayBlockedException ||
          hasOverlapErrorCode(error)
        ) {
          result.skipped.push(occurrence.day);
          continue;
        }
        throw error;
      }
    }
    return result;
  }

  async findMentorFreeBlocks(
    mentorId: string,
    query: WeekQueryDto,
  ): Promise<AvailabilityBlockResponse[]> {
    await this.mentorsService.findOne(mentorId);

    const now = new Date();

    const to = new Date(query.to);
    const from = new Date(
      Math.max(new Date(query.from).getTime(), now.getTime()),
    );
    if (from >= to) {
      return [];
    }

    const [blocks, blockedDays] = await Promise.all([
      this.availabilityRepository.findMentorFreeBlocksInRange(
        mentorId,
        from,
        to,
      ),
      this.blockedDatesService.findBlockedDays(mentorId, from, to),
    ]);
    const offeredBlocks = blocks.filter(
      (block) => !blockedDays.has(toBoliviaTime(block.startAt).date),
    );
    return this.availabilityMapper.toResponseList(offeredBlocks);
  }

  async findMyAvailabilityStatus(
    mentorId: string,
  ): Promise<MentorAvailabilityStatusResponse> {
    const mentor = await this.mentorsService.findOne(mentorId);
    return this.availabilityMapper.toAvailabilityStatusResponse(
      mentor.id,
      mentor.isAvailable,
    );
  }

  async updateAvailabilityStatus(
    userId: string,
    mentorId: string,
    isAvailable: boolean,
  ): Promise<MentorAvailabilityStatusResponse> {
    if (userId !== mentorId) {
      throw new MentorAvailabilityNotOwnedException();
    }
    const updated = await this.mentorsService.updateAvailability(
      mentorId,
      isAvailable,
    );
    return this.availabilityMapper.toAvailabilityStatusResponse(
      updated.id,
      updated.isAvailableForMentoring,
    );
  }
}
