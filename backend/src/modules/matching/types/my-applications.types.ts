export interface MyApplicationRecord {
  id: string;
  appliedAt: Date;
  jobOfferId: string;
  status: { title: string };
  jobOffer: {
    title: string;
    company: { title: string };
  };
}

export interface OwnedApplicationRecord {
  id: string;
  status: { title: string };
}

export interface MyApplicationResponse {
  id: string;
  jobOfferId: string;
  vacancyTitle: string;
  companyName: string;
  affinityPercentage: number;
  status: string;
  appliedDate: string;
}
