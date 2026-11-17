import type { ApplicationContactRecruiterResponse } from './application-contact-recruiter-response.types.js';

export interface ApplicationContactResponse {
  applicationId: string;
  jobOfferId: string;
  vacancyTitle: string;
  companyId: string;
  companyName: string;
  recruiters: ApplicationContactRecruiterResponse[];
}
