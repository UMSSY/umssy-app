import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { paginationSchema } from '../utils/pagination.js';

export const reportHistoryQuerySchema = paginationSchema;

export type ReportHistoryQuery = z.infer<typeof reportHistoryQuerySchema>;

export class ReportHistoryQueryDto extends createZodDto(
  reportHistoryQuerySchema,
) {}
