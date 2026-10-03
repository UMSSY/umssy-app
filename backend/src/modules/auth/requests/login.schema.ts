import { z } from 'zod';
import { ROLE_NAMES } from '../../../common/enums/roles.enum.js';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  roleTag: z.enum(ROLE_NAMES),
});

export type LoginDto = z.infer<typeof loginSchema>;
