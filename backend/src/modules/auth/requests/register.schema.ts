import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(150).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'La contraseña es demasiado larga'),
  roleTag: z.enum(['estudiante', 'titulado']),
}).strict();

export class RegisterDto extends createZodDto(registerSchema) {}
