import type { ApplicationStatus } from '../types/applications.types.js';

export interface NotifyStateChangedParams {
  recipientId: string;
  applicationId: string;
  previousStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  jobTitle: string;
  companyName: string;
}
