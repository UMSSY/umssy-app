import type { ContractType } from "./contract-type.types";
import type { Modality } from "./modality.types";

export interface CreateJobOfferPayload {
  title: string;
  description: string;
  modality: Modality;
  contractType: ContractType;
  category: string;
  positionsAvailable: number;
  salaryMin?: number;
  salaryMax?: number;
  languages: string;
  locationUrl: string;
  skillIds: string[];
}
