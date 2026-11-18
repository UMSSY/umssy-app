import { z } from 'zod';

export const jobOfferParamsSchema = z.object({
  id: z.uuid({ error: 'El identificador de la vacante no es valido' }),
});

export type JobOfferParams = z.infer<typeof jobOfferParamsSchema>;
