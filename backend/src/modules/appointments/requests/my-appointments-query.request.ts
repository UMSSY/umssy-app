import { z } from 'zod';

export const myAppointmentsQuerySchema = z.strictObject({
  scope: z
    .enum(['upcoming', 'past'], {
      error: 'El alcance debe ser upcoming o past',
    })
    .default('upcoming'),
});
