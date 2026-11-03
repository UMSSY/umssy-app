import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const verifyPasswordResetSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, 'El código debe tener 6 dígitos numéricos'),
});

export class VerifyPasswordResetDto extends createZodDto(verifyPasswordResetSchema) {}
