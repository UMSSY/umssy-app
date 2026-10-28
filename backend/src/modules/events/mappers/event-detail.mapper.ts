import type { EventWithRelations } from '../types/event-with-relations.types.js';
import type { EventDetailResponse } from '../types/event-detail-response.types.js';
import { mapEventToResponse } from './event.mapper.js';

export function mapEventDetailToResponse(
  event: EventWithRelations & { modality: { id: string; title: string } },
): EventDetailResponse {
  const availableSpots = event.capacity === null ? null : Math.max(0, event.capacity - event._count.registrations);
  return { ...mapEventToResponse(event, availableSpots), modality: event.modality };
}
