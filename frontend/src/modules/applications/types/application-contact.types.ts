import type { ApplicationContactRecruiter } from "./application-contact-recruiter.types";

export interface ApplicationContact {
  applicationId: string;
  jobOfferId: string;
  vacancyTitle: string;
  companyId: string;
  companyName: string;
  recruiters: ApplicationContactRecruiter[];
}
