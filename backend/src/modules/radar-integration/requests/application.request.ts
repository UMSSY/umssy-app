import { z } from 'zod';

export const applicationRequestSchema = z
  .object({
    jobOfferId: z.uuid(),
    consent: z.literal(true),
    consentCv: z.literal(true),
    consentContact: z.literal(true),
  })
  .strict();
