import { z } from 'zod';
import {
  JOB_OFFER_DESCRIPTION_MAX_LENGTH,
  JOB_OFFER_LANGUAGES_MAX_LENGTH,
  JOB_OFFER_MAX_EXPERIENCE_YEARS,
  JOB_OFFER_MAX_POSITIONS,
  JOB_OFFER_MAX_REQUIREMENTS,
  JOB_OFFER_MAX_SALARY,
  JOB_OFFER_MAX_SKILLS,
  JOB_OFFER_REQUIREMENT_MAX_LENGTH,
  JOB_OFFER_TITLE_MAX_LENGTH,
  JOB_OFFER_VALIDATION_MESSAGES as MESSAGES,
} from '../constants/job-offer.constants.js';
import { JobOfferContractType, JobOfferModality } from '../types/job-offer.enum.js';

const salarySchema = z
  .number()
  .int()
  .min(1, MESSAGES.SALARY_NOT_POSITIVE)
  .max(JOB_OFFER_MAX_SALARY, MESSAGES.SALARY_TOO_HIGH);

const requirementListSchema = z
  .array(z.string().trim().min(1).max(JOB_OFFER_REQUIREMENT_MAX_LENGTH, MESSAGES.REQUIREMENT_TOO_LONG))
  .max(JOB_OFFER_MAX_REQUIREMENTS, MESSAGES.REQUIREMENTS_TOO_MANY);

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
    .max(JOB_OFFER_DESCRIPTION_MAX_LENGTH, MESSAGES.DESCRIPTION_TOO_LONG),
  modality: z.enum(JobOfferModality, { message: MESSAGES.INVALID_MODALITY }),
  contractType: z.enum(JobOfferContractType, { message: MESSAGES.INVALID_CONTRACT_TYPE }),
  category: z.string().trim().min(1, MESSAGES.REQUIRED_FIELD),
  positionsAvailable: z
    .number()
    .int(MESSAGES.POSITIONS_NOT_INTEGER)
    .min(1, MESSAGES.POSITIONS_TOO_FEW)
    .max(JOB_OFFER_MAX_POSITIONS, MESSAGES.POSITIONS_TOO_MANY),
  salaryMin: salarySchema.optional(),
  salaryMax: salarySchema.optional(),
  languages: z
    .string()
    .trim()
    .min(1, MESSAGES.REQUIRED_FIELD)
    .max(JOB_OFFER_LANGUAGES_MAX_LENGTH, MESSAGES.LANGUAGES_TOO_LONG),
  locationUrl: z
    .string()
    .trim()
    .min(1, MESSAGES.REQUIRED_FIELD)
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
    .max(JOB_OFFER_MAX_EXPERIENCE_YEARS, MESSAGES.EXPERIENCE_OUT_OF_RANGE)
    .optional(),
  otherRequirements: requirementListSchema.optional(),
});

type SalaryFields = Pick<z.infer<typeof jobOfferFieldsSchema>, 'contractType' | 'salaryMin' | 'salaryMax'>;

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
