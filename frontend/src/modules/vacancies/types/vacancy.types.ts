export interface PublishedJobOffer {
  id: string;
  title: string;
  description: string;
  category: string;
  modality: string;
  contractType: string;
  status: string;
  positionsAvailable: number;
  salaryRange: string;
  languages: string;
  locationUrl: string;
  expiresAt: string | null;
  createdAt: string;
  company: { id: string; name: string };
  skills: Array<{ id: string; name: string }>;
}

export interface Vacancy {
  id: string;
  title: string;
  companyName: string;
  description: string;
  requirements: string[];
  salary: string;
  modality: string;
  contractType: string;
  languages: string;
  positionsAvailable: number;
  locationUrl: string;
}
