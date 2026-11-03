import type { JobOfferContractType } from './job-offer.enum.js';

export interface SalaryFields {
  contractType: JobOfferContractType;
  salaryMin?: number;
  salaryMax?: number;
}
