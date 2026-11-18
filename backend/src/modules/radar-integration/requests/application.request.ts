import { z } from 'zod';

export const applicationRequestSchema = z
  .object({
    jobOfferId: z.uuid(),
    consent: z.literal(true),
    consentCv: z.literal(true),
    consentContact: z.literal(true),
  })
  .strict()
  .meta({
    example: {
      jobOfferId: 'a0000000-0000-4000-8000-000000000003',
      consent: true,
      consentCv: true,
      consentContact: true,
    },
  });
