import { randomUUID } from 'node:crypto';
import {
  MEETING_BASE_URL,
  MEETING_ROOM_PREFIX,
} from '../constants/meeting-url.constants.js';
import { ACTIVE_APPOINTMENT_STATUS_TITLES } from '../constants/active-appointment-statuses.constants.js';

export const buildMeetingUrl = (): string =>
  `${MEETING_BASE_URL}/${MEETING_ROOM_PREFIX}${randomUUID()}`;

// El enlace solo se comparte mientras la cita está confirmada y no ha terminado.
export const canShareMeetingUrl = (
  statusTitle: string,
  endAt: Date,
  now: Date,
): boolean =>
  ACTIVE_APPOINTMENT_STATUS_TITLES.some((title) => title === statusTitle) &&
  endAt.getTime() > now.getTime();
