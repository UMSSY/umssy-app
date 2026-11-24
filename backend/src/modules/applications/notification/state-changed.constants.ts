import { ApplicationStatus } from '../types/applications.types.js';

export const APPLICATION_STATUS_CODES = [
  'IN_REVIEW',
  'INTERVIEW',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
] as const;

export const STATUS_CODE_BY_TITLE: Record<
  ApplicationStatus,
  (typeof APPLICATION_STATUS_CODES)[number]
> = {
  [ApplicationStatus.IN_REVIEW]: 'IN_REVIEW',
  [ApplicationStatus.INTERVIEW]: 'INTERVIEW',
  [ApplicationStatus.ACCEPTED]: 'ACCEPTED',
  [ApplicationStatus.REJECTED]: 'REJECTED',
  [ApplicationStatus.WITHDRAWN]: 'WITHDRAWN',
};

export const STATE_CHANGED_ACTION_PATH = '/vacancies/my-applications';

export const NOTIFY_TIMEOUT_MS = 5000;
