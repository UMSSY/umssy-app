import type { z } from 'zod';
import type { APPLICATION_STATUS_CODES } from './state-changed.constants.js';
import type { StateChangedDto } from './state-changed.dto.js';
import type { ApplicationStatus } from '../types/applications.types.js';

export type ApplicationStatusCode = (typeof APPLICATION_STATUS_CODES)[number];

export type StateChangedPayload = z.infer<typeof StateChangedDto>;

export interface NotifyStateChangedParams {
  recipientId: string;
  applicationId: string;
  previousStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  jobTitle: string;
  companyName: string;
}
