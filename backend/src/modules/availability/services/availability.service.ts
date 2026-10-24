import { Injectable } from '@nestjs/common';
import { AvailabilityRepository } from '../repositories/availability.repository.js';
import { AvailabilityMapper } from '../mappers/availability.mapper.js';
import {
  BlockHasAppointmentException,
  BlockNotFoundException,
  BlockNotOwnedException,
  BlockOverlapException,
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
import type { OwnerAvailabilityBlockResponse } from '../types/owner-availability-block-response.types.js';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly availabilityRepository: AvailabilityRepository,
    private readonly availabilityMapper: AvailabilityMapper,
    private readonly mentorsService: MentorsService,
    private readonly blockedDatesService: BlockedDatesService,
  ) {}

  async remove(mentorId: string, blockId: string): Promise<DeletedBlockResponse> {
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
    const movesToAnotherDay = toBoliviaTime(block.startAt).date !== toBoliviaTime(payload.startAt).date;

    try {
      const updated = movesToAnotherDay
        ? await this.blockedDatesService.runOnUnblockedDay(mentorId, payload.startAt, save)
        : await save();
      return this.availabilityMapper.toResponse(updated);
    } catch (error) {
      if (hasOverlapErrorCode(error)) {
        throw new BlockOverlapException();
      }
      throw error;
    }
  }

  async create(mentorId: string, payload: CreateBlockDto): Promise<AvailabilityBlockResponse> {
    try {
      const block = await this.blockedDatesService.runOnUnblockedDay(mentorId, payload.startAt, (tx) =>
        this.availabilityRepository.create(mentorId, payload.startAt, payload.endAt, tx),
      );
      return this.availabilityMapper.toResponse({ ...block, appointments: [] });
    } catch (error) {
      if (hasOverlapErrorCode(error)) {
        throw new BlockOverlapException();
      }
      throw error;
    }
  }

  async findMentorFreeBlocks(mentorId: string, query: WeekQueryDto): Promise<AvailabilityBlockResponse[]> {
    await this.mentorsService.findOne(mentorId);

    const now = new Date();

    const to = new Date(query.to);
    const from = new Date(Math.max(new Date(query.from).getTime(), now.getTime()));
    if (from >= to) {
      return [];
    }

    const [blocks, blockedDays] = await Promise.all([
      this.availabilityRepository.findMentorFreeBlocksInRange(mentorId, from, to),
      this.blockedDatesService.findBlockedDays(mentorId, from, to),
    ]);
    const offeredBlocks = blocks.filter((block) => !blockedDays.has(toBoliviaTime(block.startAt).date));
    return this.availabilityMapper.toResponseList(offeredBlocks);
  }

  async findMyAvailabilityStatus(mentorId: string): Promise<MentorAvailabilityStatusResponse> {
    const mentor = await this.mentorsService.findOne(mentorId);
    return this.availabilityMapper.toAvailabilityStatusResponse(mentor.id, mentor.isAvailable);
  }

  async updateAvailabilityStatus(
    userId: string,
    mentorId: string,
    isAvailable: boolean,
  ): Promise<MentorAvailabilityStatusResponse> {
    if (userId !== mentorId) {
      throw new MentorAvailabilityNotOwnedException();
    }
    const updated = await this.mentorsService.updateAvailability(mentorId, isAvailable);
    return this.availabilityMapper.toAvailabilityStatusResponse(updated.id, updated.isAvailableForMentoring);
  }
}
