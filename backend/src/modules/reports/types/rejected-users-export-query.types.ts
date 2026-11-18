import type { z } from 'zod';
import type { rejectedUsersExportQuerySchema } from '../requests/report-users.schema.js';

export type RejectedUsersExportQuery = z.infer<typeof rejectedUsersExportQuerySchema>;
