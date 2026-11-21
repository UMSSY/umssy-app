import { getRegistrationEventTimestamp } from './registration-format';
import type { ManagedWorkshop } from '../types/managed-workshop.types';

export function isManagedWorkshopFinished(workshop: ManagedWorkshop, now = Date.now()): boolean {
  const endsAt = getRegistrationEventTimestamp(workshop.eventDate, workshop.endTime);
  return Number.isFinite(endsAt) && now >= endsAt;
}
