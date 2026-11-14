import { formatRegistrationTime } from './registration-format';
import type { ManagedWorkshop } from '../types/managed-workshop.types';

export function isManagedWorkshopFinished(workshop: ManagedWorkshop, now = Date.now()): boolean {
  const date = workshop.eventDate.split('T')[0];
  const time = formatRegistrationTime(workshop.endTime);
  if (time === 'Horario no disponible') return false;
  // Las fechas y horas de eventos se expresan en hora local de Bolivia.
  const endsAt = Date.parse(`${date}T${time}:00-04:00`);
  return Number.isFinite(endsAt) && now >= endsAt;
}
