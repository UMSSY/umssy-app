import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const googleLinkSchema = z.object({
  credential: z.string().min(1).optional(),
  idToken: z.string().min(1).optional(),
  email: z.string().email().optional(),
  googleEmail: z.string().email().optional(),
});

export class GoogleLinkDto extends createZodDto(googleLinkSchema) {}
