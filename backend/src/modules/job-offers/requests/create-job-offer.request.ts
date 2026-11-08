import { z } from 'zod';
import { JOB_OFFER_MAX_SKILLS, JOB_OFFER_TITLE_MAX_LENGTH, JOB_OFFER_VALIDATION_MESSAGES as MESSAGES } from '../constants/job-offer.constants.js';
import { JobOfferContractType, JobOfferModality } from '../types/job-offer.enum.js';
import type { SalaryFields } from '../types/salary-fields.type.js';

const salarySchema = z
  .number()
  .int()
  .min(1, MESSAGES.SALARY_NOT_POSITIVE)
  .max(999_999_999, MESSAGES.SALARY_TOO_HIGH);

const requirementListSchema = z
  .array(z.string().trim().min(1).max(120, MESSAGES.REQUIREMENT_TOO_LONG))
  .max(10, MESSAGES.REQUIREMENTS_TOO_MANY);

export const jobOfferFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, MESSAGES.REQUIRED_FIELD)
    .max(JOB_OFFER_TITLE_MAX_LENGTH, MESSAGES.TITLE_TOO_LONG)
    .regex(/^[a-zA-Z0-9\sÁÉÍÓÚÜÑáéíóúüñ]+$/, MESSAGES.TITLE_INVALID_CHARACTERS),
  description: z
    .string()
    .trim()
    .min(1, MESSAGES.REQUIRED_FIELD)
    .max(3000, MESSAGES.DESCRIPTION_TOO_LONG),
  modality: z.enum(JobOfferModality, { message: MESSAGES.INVALID_MODALITY }),
  contractType: z.enum(JobOfferContractType, { message: MESSAGES.INVALID_CONTRACT_TYPE }),
  category: z
    .string()
    .trim()
    .min(1, MESSAGES.REQUIRED_FIELD)
    .max(100, MESSAGES.CATEGORY_TOO_LONG),
  positionsAvailable: z
    .number()
    .int(MESSAGES.POSITIONS_NOT_INTEGER)
    .min(1, MESSAGES.POSITIONS_TOO_FEW)
    .max(500, MESSAGES.POSITIONS_TOO_MANY),
  salaryMin: salarySchema.optional(),
  salaryMax: salarySchema.optional(),
  languages: z
    .string()
    .trim()
    .min(1, MESSAGES.REQUIRED_FIELD)
    .max(100, MESSAGES.LANGUAGES_TOO_LONG),
  locationUrl: z
    .string()
    .trim()
    .min(1, MESSAGES.REQUIRED_FIELD)
    .max(2048, MESSAGES.LOCATION_URL_TOO_LONG)
    .regex(
      /^https:\/\/(?:maps\.app\.goo\.gl\/[\w-]+|goo\.gl\/maps\/[\w-]+|(?:www\.)?google\.com(?:\.[a-z]{2})?\/maps\/place\/[^/\s?#]+\/@-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,\d+(?:\.\d+)?[zm])(?:[/?#]\S*)?$/,
      MESSAGES.INVALID_LOCATION_URL,
    ),
  skillIds: z
    .array(z.uuid(MESSAGES.INVALID_SKILL_ID))
    .min(1, MESSAGES.SKILLS_REQUIRED)
    .max(JOB_OFFER_MAX_SKILLS, MESSAGES.SKILLS_TOO_MANY),
  requiredCareers: requirementListSchema.optional(),
  minExperienceYears: z
    .number()
    .int(MESSAGES.EXPERIENCE_NOT_INTEGER)
    .min(0, MESSAGES.EXPERIENCE_OUT_OF_RANGE)
    .max(40, MESSAGES.EXPERIENCE_OUT_OF_RANGE)
    .optional(),
  otherRequirements: requirementListSchema.optional(),
});

export const hasRequiredSalary = (data: SalaryFields): boolean =>
  data.salaryMin !== undefined ||
  (data.contractType === JobOfferContractType.INTERNSHIP && data.salaryMax === undefined);

export const hasValidSalaryRange = (data: SalaryFields): boolean =>
  data.salaryMin === undefined || data.salaryMax === undefined || data.salaryMin <= data.salaryMax;

export const createJobOfferSchema = jobOfferFieldsSchema
  .extend({
    requiredCareers: requirementListSchema.default([]),
    otherRequirements: requirementListSchema.default([]),
  })
  .refine(hasRequiredSalary, { path: ['salaryMin'], message: MESSAGES.REQUIRED_FIELD })
  .refine(hasValidSalaryRange, { path: ['salaryMin'], message: MESSAGES.SALARY_RANGE_INVALID });

export type CreateJobOfferRequest = z.infer<typeof createJobOfferSchema>;
