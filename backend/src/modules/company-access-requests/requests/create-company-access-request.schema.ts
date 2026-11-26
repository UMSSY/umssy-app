import { z } from 'zod';
import {
  BOLIVIAN_MOBILE_PATTERN,
  COMPANY_NAME_CHARACTERS,
  COMPANY_NAME_CHARACTERS_MESSAGE,
  COMPANY_NAME_HAS_LETTER_OR_DIGIT,
  COMPANY_NAME_LENGTH_MESSAGE,
  DESCRIPTION_LENGTH_MESSAGE,
  PHONE_MESSAGE,
  USERNAME_MESSAGE,
  USERNAME_PATTERN,
  WEBSITE_INVALID_MESSAGE,
  WEBSITE_PATTERN,
  WEBSITE_REQUIRED_MESSAGE,
} from '../constants/company-registration-rules.constants.js';

const companyNameField = z
  .string()
  .trim()
  .min(4, COMPANY_NAME_LENGTH_MESSAGE)
  .max(30, COMPANY_NAME_LENGTH_MESSAGE)
  .regex(COMPANY_NAME_CHARACTERS, COMPANY_NAME_CHARACTERS_MESSAGE)
  .refine((value) => COMPANY_NAME_HAS_LETTER_OR_DIGIT.test(value), {
    message: COMPANY_NAME_CHARACTERS_MESSAGE,
  });

const descriptionField = z
  .string()
  .trim()
  .min(10, DESCRIPTION_LENGTH_MESSAGE)
  .max(500, DESCRIPTION_LENGTH_MESSAGE);

const websiteUrlField = z
  .string({ error: WEBSITE_REQUIRED_MESSAGE })
  .trim()
  .min(1, WEBSITE_REQUIRED_MESSAGE)
  .max(255, WEBSITE_INVALID_MESSAGE)
  .regex(WEBSITE_PATTERN, WEBSITE_INVALID_MESSAGE);

const phoneField = z.string().trim().regex(BOLIVIAN_MOBILE_PATTERN, PHONE_MESSAGE);

const usernameField = z.string().trim().regex(USERNAME_PATTERN, USERNAME_MESSAGE);

export const createCompanyAccessRequestSchema = z.object({
  companyName: companyNameField,
  sector: z.string().trim().min(2, 'El rubro es obligatorio').max(100),
  cityId: z.string().uuid('Selecciona una ciudad válida'),
  description: descriptionField,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Correo electrónico inválido')
    .max(150),
  phone: phoneField,
  websiteUrl: websiteUrlField,
  username: usernameField,
});

export const updateCompanyAccessRequestSchema = z.object({
  companyName: companyNameField.optional(),
  sector: z.string().trim().min(2).max(100).optional(),
  cityId: z.string().uuid().optional(),
  description: descriptionField.optional(),
  email: z.string().trim().toLowerCase().email().max(150).optional(),
  phone: phoneField.optional(),
  websiteUrl: websiteUrlField.optional(),
  username: usernameField.optional(),
});

export const requestCorrectionSchema = z.object({
  reasonCategory: z
    .string()
    .trim()
    .min(3, 'Selecciona una categoría de observación')
    .max(150),
  customDetails: z
    .string()
    .trim()
    .min(10, 'El detalle de la observación debe tener al menos 10 caracteres')
    .max(1000),
});

export const rejectCompanyAccessRequestSchema = z.object({
  reason: z.string().trim().min(5).max(1000).optional(),
  reasonCategory: z.string().trim().optional(),
  customDetails: z.string().trim().optional(),
});

export const listCompanyAccessRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z
    .enum(['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ALL'])
    .default('ALL'),
  search: z.string().trim().optional(),
});

export const activateCompanyAccountSchema = z.object({
  requestCode: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().length(6, 'El código debe tener 6 dígitos'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72),
});

export const reportInconsistencySchema = z.object({
  requestCode: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  observation: z
    .string()
    .trim()
    .min(5, 'La observación debe tener al menos 5 caracteres')
    .max(500),
});

export type CreateCompanyAccessRequestDto = z.infer<
  typeof createCompanyAccessRequestSchema
>;
export type UpdateCompanyAccessRequestDto = z.infer<
  typeof updateCompanyAccessRequestSchema
>;
export type RequestCorrectionDto = z.infer<typeof requestCorrectionSchema>;
export type RejectCompanyAccessRequestDto = z.infer<
  typeof rejectCompanyAccessRequestSchema
>;
export type ListCompanyAccessRequestsQuery = z.infer<
  typeof listCompanyAccessRequestsQuerySchema
>;
export type ActivateCompanyAccountDto = z.infer<
  typeof activateCompanyAccountSchema
>;
export type ReportInconsistencyDto = z.infer<typeof reportInconsistencySchema>;
