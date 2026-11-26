import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ROLE_NAMES } from '../../../common/enums/roles.enum.js';

export const googleLinkConfirmSchema = z.object({
  linkToken: z.string().min(1),
  roleTag: z.enum(ROLE_NAMES).optional(),
});

export class GoogleLinkConfirmDto extends createZodDto(
  googleLinkConfirmSchema,
) {}
