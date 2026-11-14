import { z } from 'zod';

export const jobApplicationConsentsSchema = z
  .object({
    consent: z.literal(true),
    consentCv: z.literal(true),
    consentContact: z.literal(true),
  })
  .strict();
export type JobApplicationConsentsRequest = z.infer<
  typeof jobApplicationConsentsSchema
>;
