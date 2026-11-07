import { z } from 'zod';

export const companyAccessSchema = z
  .object({
    userId: z.uuid(),
    companyId: z.uuid(),
  })
  .strict();
export type CompanyAccessRequest = z.infer<typeof companyAccessSchema>;

export const applicationRequestSchema = z
  .object({
    jobOfferId: z.uuid(),
    consent: z.boolean().default(false),
    consentCv: z.boolean().default(false),
    consentContact: z.boolean().default(false),
  })
  .strict();
export type ApplicationRequest = z.infer<typeof applicationRequestSchema>;

export const applicationConsentsSchema = z
  .object({
    consent: z.boolean(),
    consentCv: z.boolean(),
    consentContact: z.boolean(),
  })
  .strict();
export type ApplicationConsentsRequest = z.infer<
  typeof applicationConsentsSchema
>;

export const recruiterDecisionSchema = z
  .object({
    decision: z.enum(['hired', 'rejected']),
  })
  .strict();
export type RecruiterDecisionRequest = z.infer<typeof recruiterDecisionSchema>;
