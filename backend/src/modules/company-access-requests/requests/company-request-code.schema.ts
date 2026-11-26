import { z } from 'zod';
import { COMPANY_REQUEST_CODE_PATTERN } from '../constants/company-document-correction.constants.js';

export const companyRequestCodeParamsSchema = z.object({
  code: z
    .string({ error: 'El código de solicitud es obligatorio' })
    .trim()
    .toUpperCase()
    .regex(COMPANY_REQUEST_CODE_PATTERN, 'El código de solicitud no es válido'),
});

export type CompanyRequestCodeParams = z.infer<
  typeof companyRequestCodeParamsSchema
>;
