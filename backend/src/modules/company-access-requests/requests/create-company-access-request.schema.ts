import { z } from 'zod';

export const createCompanyAccessRequestSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, 'El nombre de la empresa es obligatorio')
    .max(100),
  sector: z.string().trim().min(2, 'El rubro es obligatorio').max(100),
  cityId: z.string().uuid('Selecciona una ciudad válida'),
  description: z
    .string()
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Correo electrónico inválido')
    .max(150),
  phone: z
    .string()
    .trim()
    .regex(/^[67]\d{7}$|^[234]\d{6,7}$/, 'Teléfono de Bolivia inválido'),
  websiteUrl: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : ''),
    z
      .string()
      .max(255)
      .refine(
        (val) => val === '' || /^https?:\/\/.+\..+/.test(val),
        'Ingresa una URL válida (ej. https://www.empresa.com)',
      ),
  ),
  username: z
    .string()
    .trim()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(100)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Solo letras, números, puntos y guiones'),
});

export const updateCompanyAccessRequestSchema = z.object({
  companyName: z.string().trim().min(2).max(100).optional(),
  sector: z.string().trim().min(2).max(100).optional(),
  cityId: z.string().uuid().optional(),
  description: z.string().trim().min(10).max(1000).optional(),
  email: z.string().trim().toLowerCase().email().max(150).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[67]\d{7}$|^[234]\d{6,7}$/, 'Teléfono de Bolivia inválido')
    .optional(),
  websiteUrl: z
    .preprocess(
      (val) => (typeof val === 'string' ? val.trim() : ''),
      z
        .string()
        .max(255)
        .refine(
          (val) => val === '' || /^https?:\/\/.+\..+/.test(val),
          'Ingresa una URL válida (ej. https://www.empresa.com)',
        ),
    )
    .optional(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .regex(/^[a-zA-Z0-9._-]+$/)
    .optional(),
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
