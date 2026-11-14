export interface ApplicationContactRecruiter {
  id: string;
  fullName: string;
}

export interface ApplicationContact {
  applicationId: string;
  jobOfferId: string;
  vacancyTitle: string;
  companyId: string;
  companyName: string;
  recruiters: ApplicationContactRecruiter[];
}
