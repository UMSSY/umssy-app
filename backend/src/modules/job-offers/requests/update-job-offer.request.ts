import type { z } from 'zod';
import { JOB_OFFER_VALIDATION_MESSAGES as MESSAGES } from '../constants/job-offer.constants.js';
import {
  hasRequiredSalary,
  hasValidSalaryRange,
  jobOfferFieldsSchema,
} from './create-job-offer.request.js';

// En la edición los requisitos que no se envían se conservan, por eso no tienen valor por defecto.
export const updateJobOfferSchema = jobOfferFieldsSchema
  .refine(hasRequiredSalary, { path: ['salaryMin'], message: MESSAGES.REQUIRED_FIELD })
  .refine(hasValidSalaryRange, { path: ['salaryMin'], message: MESSAGES.SALARY_RANGE_INVALID });

export type UpdateJobOfferRequest = z.infer<typeof updateJobOfferSchema>;
