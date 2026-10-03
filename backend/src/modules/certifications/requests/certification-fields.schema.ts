import { z } from 'zod';

export const certificationNameSchema = z.string().min(1).max(150);

export const issuingOrganizationSchema = z.string().min(1).max(100);

export const issueDateSchema = z
  .string()
  .min(1)
  .pipe(z.coerce.date())
  .refine((date) => date.getTime() <= Date.now(), {
    message: 'Issue date cannot be in the future',
  });
