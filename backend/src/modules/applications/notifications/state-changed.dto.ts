import { z } from 'zod';

export const APPLICATION_STATUSES = [
  'SUBMITTED',
  'IN_REVIEW',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFERED',
  'REJECTED',
  'WITHDRAWN',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const StateChangedDto = z
  .object({
    jobTitle: z.string().trim().min(1).max(150),
    companyName: z.string().trim().min(1).max(150),
    newStatus: z.enum(APPLICATION_STATUSES),
    previousStatus: z.enum(APPLICATION_STATUSES).optional(),
    actionUrl: z.string().url(),
  })
  .strict(); 

export type StateChangedPayload = z.infer<typeof StateChangedDto>;