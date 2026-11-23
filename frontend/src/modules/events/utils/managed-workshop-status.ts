import { getScheduleBounds } from './event-sessions';
import type { ManagedWorkshop } from '../types/managed-workshop.types';

export function isManagedWorkshopFinished(workshop: ManagedWorkshop, now = Date.now()): boolean {
  // Un taller multisesión finaliza al terminar su última sesión.
  const { endsAt } = getScheduleBounds({ ...workshop, date: workshop.eventDate });
  return Number.isFinite(endsAt) && now >= endsAt;
}
