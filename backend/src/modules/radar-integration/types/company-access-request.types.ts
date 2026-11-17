import type { z } from 'zod';
import type { companyAccessSchema } from '../requests/company-access.request.js';

export type CompanyAccessRequest = z.infer<typeof companyAccessSchema>;
