import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export class RequestPasswordResetDto extends createZodDto(requestPasswordResetSchema) {}
