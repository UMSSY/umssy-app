import { z } from 'zod';
import { ApplicationStatus } from '../types/applications.types.js';

export const APPLICATION_SORT_FIELDS = [
  'vacancy',
  'company',
  'affinity',
  'status',
  'date',
] as const;

export const APPLICATION_SORT_ORDERS = ['asc', 'desc'] as const;

export const findApplicationsQuerySchema = z.object({
  status: z.nativeEnum(ApplicationStatus).optional(),
  sortBy: z.enum(APPLICATION_SORT_FIELDS).optional(),
  sortOrder: z.enum(APPLICATION_SORT_ORDERS).optional().default('desc'),
});

export type FindApplicationsQueryDto = z.infer<
  typeof findApplicationsQuerySchema
>;
