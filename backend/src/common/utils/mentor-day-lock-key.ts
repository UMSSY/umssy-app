import { MENTOR_DAY_LOCK_NAMESPACE } from '../constants/mentor-day-lock.constants.js';

export const buildMentorDayLockKey = (mentorId: string, day: string): string =>
  `${MENTOR_DAY_LOCK_NAMESPACE}:${mentorId}:${day}`;
