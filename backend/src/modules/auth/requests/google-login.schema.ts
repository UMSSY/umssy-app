import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ROLE_NAMES } from '../../../common/enums/roles.enum.js';

export const googleLoginSchema = z.object({
  credential: z.string().min(1).optional(),
  idToken: z.string().min(1).optional(),
  email: z.string().email().optional(),
  roleTag: z.enum(ROLE_NAMES).optional(),
});

export class GoogleLoginDto extends createZodDto(googleLoginSchema) {}
