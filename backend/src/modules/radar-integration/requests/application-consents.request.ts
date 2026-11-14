import { z } from 'zod';

export const applicationConsentsSchema = z
  .object({
    consent: z.boolean(),
    consentCv: z.boolean(),
    consentContact: z.boolean(),
  })
  .strict();
