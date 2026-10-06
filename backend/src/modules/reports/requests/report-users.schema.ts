import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  FIRST_REPORT_YEAR,
  MAX_SEARCH_LENGTH,
  REPORT_VALIDATION_MESSAGES as MESSAGES,
} from '../constants/report-validation.constants.js';
import { paginationSchema } from '../utils/pagination.js';
import { REPORT_USER_TYPES } from '../types/report-user.types.js';

const searchSchema = z
  .string({ error: MESSAGES.searchInvalid })
  .trim()
  .max(MAX_SEARCH_LENGTH, { error: MESSAGES.searchMax })
  .optional();

export const registeredUsersFiltersSchema = z.object({
  userType: z
    .enum(REPORT_USER_TYPES, { error: MESSAGES.userTypeInvalid })
    .optional(),
  year: z.coerce
    .number({ error: MESSAGES.yearInvalid })
    .int({ error: MESSAGES.yearInvalid })
    .min(FIRST_REPORT_YEAR, { error: MESSAGES.yearMin })
    .optional(),
  search: searchSchema,
});

export const registeredUsersQuerySchema = paginationSchema.extend(
  registeredUsersFiltersSchema.shape,
);

export const rejectedUsersFiltersSchema = z.object({
  search: searchSchema,
});

export const rejectedUsersQuerySchema = paginationSchema.extend(
  rejectedUsersFiltersSchema.shape,
);

export type RegisteredUsersFilters = z.infer<
  typeof registeredUsersFiltersSchema
>;
export type RegisteredUsersQuery = z.infer<typeof registeredUsersQuerySchema>;
export type RejectedUsersFilters = z.infer<typeof rejectedUsersFiltersSchema>;
export type RejectedUsersQuery = z.infer<typeof rejectedUsersQuerySchema>;

export class RegisteredUsersFiltersDto extends createZodDto(
  registeredUsersFiltersSchema,
) {}
export class RegisteredUsersQueryDto extends createZodDto(
  registeredUsersQuerySchema,
) {}
export class RejectedUsersFiltersDto extends createZodDto(
  rejectedUsersFiltersSchema,
) {}
export class RejectedUsersQueryDto extends createZodDto(
  rejectedUsersQuerySchema,
) {}
