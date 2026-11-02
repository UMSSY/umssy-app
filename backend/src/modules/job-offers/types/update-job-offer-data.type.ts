import type { CreateJobOfferData } from './create-job-offer-data.type.js';

export type UpdateJobOfferData = Omit<CreateJobOfferData, 'companyId' | 'statusId'>;
