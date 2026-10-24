import { Injectable } from '@nestjs/common';
import type { BlockedDate } from '../../../prisma/client.js';
import type { BlockedDateResponse } from '../types/blocked-date-response.types.js';
import type { DeletedBlockedDateResponse } from '../types/deleted-blocked-date-response.types.js';
import { toDayString } from '../utils/bolivia-day.js';

@Injectable()
export class BlockedDateMapper {
  toResponse(blockedDate: BlockedDate): BlockedDateResponse {
    return {
      id: blockedDate.id,
      mentorId: blockedDate.mentorId,
      blockedOn: toDayString(blockedDate.blockedOn),
      reason: blockedDate.reason,
      createdAt: blockedDate.createdAt.toISOString(),
    };
  }

  toResponseList(blockedDates: BlockedDate[]): BlockedDateResponse[] {
    return blockedDates.map((blockedDate) => this.toResponse(blockedDate));
  }

  toDeletedResponse(blockedDate: BlockedDate): DeletedBlockedDateResponse {
    return { id: blockedDate.id };
  }
}
