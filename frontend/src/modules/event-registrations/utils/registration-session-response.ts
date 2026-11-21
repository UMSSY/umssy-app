import { readArray, readNullableString, readRecord, readString } from '@/shared/utils/response-validation';
import type { RegistrationSession } from '../types/registration-session.types';

// Lee las sesiones del taller; sin `location` se asume la ubicación del taller.
export function parseRegistrationSessions(value: unknown): RegistrationSession[] {
  return readArray(value).map((item) => {
    const session = readRecord(item);
    return {
      id: readString(session.id),
      startsAt: readString(session.startsAt),
      endsAt: readString(session.endsAt),
      location: session.location === undefined ? null : readNullableString(session.location),
    };
  });
}
