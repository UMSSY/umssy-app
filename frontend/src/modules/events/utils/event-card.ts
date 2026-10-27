import type { EventCapacityStatus, EventItem } from '../types/event.types';
import { formatRegistrationTime } from './registration-format';

export function calculateEventCapacityStatus(
  event: EventItem,
): EventCapacityStatus {
  const enrolledCount = Math.max(0, event.registrationCount);
  const { capacity, availableSpots } = event;

  if (capacity === null) {
    return {
      enrolledCount,
      capacity: null,
      progressPercentage: null,
      isFull: false,
    };
  }

  const safeCapacity = Math.max(0, capacity);
  const isFull = availableSpots === 0 || enrolledCount >= safeCapacity;
  const progressPercentage =
    safeCapacity === 0
      ? 100
      : Math.min(Math.round((enrolledCount / safeCapacity) * 100), 100);

  return {
    enrolledCount,
    capacity,
    progressPercentage,
    isFull,
  };
}

export function formatEventDate(eventDate: string): string {
  if (!eventDate) return 'Fecha por confirmar';
  const datePart = eventDate.split('T')[0];
  const parts = datePart.split('-').map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return eventDate;
  }

  const [year, month, day] = parts;
  const dateObj = new Date(Date.UTC(year, month - 1, day));

  if (!Number.isFinite(dateObj.getTime())) return 'Fecha por confirmar';
  return new Intl.DateTimeFormat('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(dateObj);
}

export function formatTimeRange(startTime: string, endTime: string): string {
  const start = formatRegistrationTime(startTime);
  const end = formatRegistrationTime(endTime);

  if (start === 'Horario no disponible' || end === 'Horario no disponible') {
    return 'Horario no disponible';
  }

  return `${start} - ${end} hrs`;
}
