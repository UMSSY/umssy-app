import { VOTING_STATUS_TITLES } from '../constants/events.constants.js';
import {
  calculateProgressPercent,
  calculateSupportsRemaining,
} from '../../../common/utils/support-progress.js';
import type {
  EventWithRelations,
  EventItemResponse,
} from '../types/events.types.js';
import { formatUtcDate, formatUtcTime } from '../utils/event-date-time.js';

export function mapEventToResponse(
  record: EventWithRelations,
  availableSpots: number | null,
): EventItemResponse {
  const supportCount = record._count.registrations;
  const threshold = record.supportThreshold;
  const hasThreshold = threshold !== null && threshold > 0;

  return {
    ...(record.coverMimeType && { coverUrl: '/events/' + record.id + '/cover' }),
    id: record.id,
    title: record.title,
    description: record.description,
    eventDate: formatUtcDate(record.eventDate),
    startTime: formatUtcTime(record.startTime),
    endTime: formatUtcTime(record.endTime),
    location: record.location,
    capacity: record.capacity,
    availableSpots,
    registrationCount: supportCount,
    instructorName: record.instructorName ?? null,
    modalityId: record.modalityId ?? null,
    category: {
      id: record.category.id,
      name: record.category.name,
    },
    statusId: record.statusId,
    status: VOTING_STATUS_TITLES.includes(record.status.title) ? 'voting' : record.status.title,
    origin: record.origin.title,
    supportCount,
    supportThreshold: hasThreshold ? threshold : null,
    supportsRemaining: hasThreshold
      ? calculateSupportsRemaining(supportCount, threshold)
      : null,
    progressPercent: hasThreshold
      ? calculateProgressPercent(supportCount, threshold)
      : null,
    votingDeadline: record.votingDeadline
      ? record.votingDeadline.toISOString()
      : null,
    hasSupported: (record.registrations?.length ?? 0) > 0,
  };
}