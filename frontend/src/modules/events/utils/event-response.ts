import type { EventItem } from '../types/event-item.types';
import type { EventDetail } from '../types/event-detail.types';
import {
  readRecord,
  readString,
  readNullableString,
  readCount,
  readNullableCount,
  readBoolean,
} from './response-validation';

export function parseEventItem(value: unknown): EventItem {
  const event = readRecord(value);
  const category = readRecord(event.category);
  return {
    ...(event.coverUrl !== undefined && {
      coverUrl: readNullableString(event.coverUrl),
    }),
    ...(event.status !== undefined && { status: readString(event.status) }),
    ...(event.supportThreshold !== undefined && {
      supportThreshold: readNullableCount(event.supportThreshold),
    }),
    ...(event.votingDeadline !== undefined && {
      votingDeadline: readNullableString(event.votingDeadline),
    }),
    ...(event.origin !== undefined && { origin: readString(event.origin) }),
    ...(event.supportCount !== undefined && {
      supportCount: readCount(event.supportCount),
    }),
    ...(event.supportsRemaining !== undefined && {
      supportsRemaining: readNullableCount(event.supportsRemaining),
    }),
    ...(event.progressPercent !== undefined && {
      progressPercent: readNullableCount(event.progressPercent),
    }),
    ...(event.hasSupported !== undefined && {
      hasSupported: readBoolean(event.hasSupported),
    }),
    id: readString(event.id),
    title: readString(event.title),
    category: { id: readString(category.id), name: readString(category.name) },
    description: readNullableString(event.description),
    instructorName: readNullableString(event.instructorName),
    eventDate: readString(event.eventDate),
    startTime: readString(event.startTime),
    endTime: readString(event.endTime),
    location: readNullableString(event.location),
    capacity: readNullableCount(event.capacity),
    availableSpots: readNullableCount(event.availableSpots),
    registrationCount: readCount(event.registrationCount),
    statusId: readString(event.statusId),
    modalityId: readString(event.modalityId),
  };
}
export function parseEventDetail(value: unknown): EventDetail {
  const event = readRecord(value);
  const modality = readRecord(event.modality);
  return {
    ...parseEventItem(event),
    modality: {
      id: readString(modality.id),
      title: readString(modality.title),
    },
  };
}
