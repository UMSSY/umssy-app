import { z } from 'zod';
import { ApplicationStatus } from '../types/applications.types.js';

export const findApplicationsQuerySchema = z.object({
  status: z.nativeEnum(ApplicationStatus).optional(),
  sortBy: z.enum(['vacancy', 'company', 'affinity', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type FindApplicationsQueryDto = z.infer<typeof findApplicationsQuerySchema>;