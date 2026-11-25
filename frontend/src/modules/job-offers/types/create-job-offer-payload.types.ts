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
  /** Fecha y hora de cierre en ISO UTC. Si no se envía, la vacante no se cierra sola. */
  expiresAt?: string;
}
