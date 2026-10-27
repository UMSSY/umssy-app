import { z } from 'zod';

export const activateApprovedAccountSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/),
    password: z
      .string()
      .min(8)
      .max(72)
      .refine((value) => Buffer.byteLength(value, 'utf8') <= 72),
  })
  .strict();
export type ActivateApprovedAccountDto = z.infer<
  typeof activateApprovedAccountSchema
>;
