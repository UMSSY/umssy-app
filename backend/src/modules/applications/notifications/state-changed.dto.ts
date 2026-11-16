import { z } from 'zod';
import { ApplicationStatus } from '../types/applications.types.js';

export const APPLICATION_STATUS_CODES = [
  'IN_REVIEW',
  'INTERVIEW',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
] as const;

export type ApplicationStatusCode = (typeof APPLICATION_STATUS_CODES)[number];

const STATUS_CODE_BY_TITLE: Record<ApplicationStatus, ApplicationStatusCode> = {
  [ApplicationStatus.IN_REVIEW]: 'IN_REVIEW',
  [ApplicationStatus.INTERVIEW]: 'INTERVIEW',
  [ApplicationStatus.ACCEPTED]: 'ACCEPTED',
  [ApplicationStatus.REJECTED]: 'REJECTED',
  [ApplicationStatus.WITHDRAWN]: 'WITHDRAWN',
};

export function toApplicationStatusCode(
  title: string,
): ApplicationStatusCode | undefined {
  return STATUS_CODE_BY_TITLE[title as ApplicationStatus];
}

export const StateChangedDto = z
  .object({
    jobTitle: z.string().trim().min(1).max(150),
    companyName: z.string().trim().min(1).max(150),
    newStatus: z.enum(APPLICATION_STATUS_CODES),
    previousStatus: z.enum(APPLICATION_STATUS_CODES).optional(),
    actionUrl: z.string().url(),
  })
  .strict();

export type StateChangedPayload = z.infer<typeof StateChangedDto>;
