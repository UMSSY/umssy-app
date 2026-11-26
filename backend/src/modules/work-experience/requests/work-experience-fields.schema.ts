import { z } from 'zod';
import { WORK_EXPERIENCE_VALIDATION_MESSAGES } from '../constants/work-experience-validation.constants.js';

function todayInBolivia(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
  }).format(new Date());
}

export const workExperienceIdSchema = z.uuid();
export const companyNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100, WORK_EXPERIENCE_VALIDATION_MESSAGES.companyNameTooLong);
export const positionSchema = z
  .string()
  .trim()
  .min(1)
  .max(150, WORK_EXPERIENCE_VALIDATION_MESSAGES.positionTooLong);
export const workExperienceDateSchema = z.iso
  .date()
  .refine((value) => value >= '1950-01-01', {
    error: WORK_EXPERIENCE_VALIDATION_MESSAGES.dateBeforeMinimum,
    abort: true,
  })
  .refine((value) => value <= todayInBolivia(), {
    error: WORK_EXPERIENCE_VALIDATION_MESSAGES.futureDate,
    abort: true,
  })
  .transform((value) => new Date(value));
export const isCurrentSchema = z.boolean();
export const workExperienceDescriptionSchema = z
  .string(WORK_EXPERIENCE_VALIDATION_MESSAGES.descriptionRequired)
  .trim()
  .min(1, WORK_EXPERIENCE_VALIDATION_MESSAGES.descriptionRequired)
  .max(5000, WORK_EXPERIENCE_VALIDATION_MESSAGES.descriptionTooLong);
