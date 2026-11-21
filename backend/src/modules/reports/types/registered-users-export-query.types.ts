import type { z } from 'zod';
import type { registeredUsersExportQuerySchema } from '../requests/report-users.schema.js';

export type RegisteredUsersExportQuery = z.infer<typeof registeredUsersExportQuerySchema>;
