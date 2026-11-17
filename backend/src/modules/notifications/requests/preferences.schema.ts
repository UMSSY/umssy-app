import { z } from 'zod';

export const UpdatePreferencesSchema = z
  .object({
    pushEnabled: z.boolean(),
    emailEnabled: z.boolean(),
    inAppEnabled: z.boolean(),
  })
  .refine((data) => !(data.pushEnabled && data.emailEnabled), {
    message: 'No se puede activar Push y correo al mismo tiempo.',
    path: ['emailEnabled'],
  });