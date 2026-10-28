import type { ContractType } from "./contract-type.types";
import type { Modality } from "./modality.types";

export interface JobOfferDetailsResponse {
  id: string;
  title: string;
  description: string;
  category: string;
  modality: Modality;
  contractType: ContractType;
  status: string;
  positionsAvailable: number;
  salaryRange: string;
  languages: string;
  locationUrl: string;
  expiresAt: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
  };
  skills: Array<{
    id: string;
    name: string;
  }>;
}
