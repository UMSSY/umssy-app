import {
  HOUR_MS,
  MINUTE_MS,
} from '../../../common/constants/date-time.constants.js';

export const SESSION_MAX_HOURS = 8;
export const SESSION_IDLE_MINUTES = 15;
export const SESSION_WARNING_MINUTES = 3;

export const SESSION_MAX_MS = SESSION_MAX_HOURS * HOUR_MS;
export const SESSION_IDLE_MS = SESSION_IDLE_MINUTES * MINUTE_MS;
export const SESSION_WARNING_MS = SESSION_WARNING_MINUTES * MINUTE_MS;

export const SESSION_IDLE_SECONDS = SESSION_IDLE_MS / 1000;
export const SESSION_WARNING_SECONDS = SESSION_WARNING_MS / 1000;
