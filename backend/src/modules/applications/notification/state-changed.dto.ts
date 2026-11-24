import { z } from 'zod';
import { APPLICATION_STATUS_CODES } from './state-changed.constants.js';

export const StateChangedDto = z
  .object({
    jobTitle: z.string().trim().min(1).max(150),
    companyName: z.string().trim().min(1).max(150),
    newStatus: z.enum(APPLICATION_STATUS_CODES),
    previousStatus: z.enum(APPLICATION_STATUS_CODES).optional(),
    actionUrl: z.string().url(),
  })
  .strict();
