import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const updateMentorAvailabilitySchema = z.strictObject({
  isAvailable: z.boolean({ error: 'Indica si recibes solicitudes de mentoría' }),
});

export class UpdateMentorAvailabilityDto extends createZodDto(updateMentorAvailabilitySchema) {}
