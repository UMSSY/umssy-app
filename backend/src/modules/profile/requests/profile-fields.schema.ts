import { z } from 'zod';

const countDigits = (value: string): number => value.replace(/\D/g, '').length;

export const personNameSchema = z.string().trim().min(1).max(100);

export const cityIdSchema = z.uuid();

export const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+?[\d\s-]+$/,
    'Phone can only contain digits, spaces, hyphens and a leading +',
  )
  .refine((value) => {
    const digits = countDigits(value);
    return digits >= 7 && digits <= 15;
  }, `Phone must have between 7 and 15 digits`);

export const personalEmailSchema = z.string().trim().pipe(z.email());

export const headlineSchema = z.string().trim().min(1).max(150);

export const aboutMeSchema = z.string().trim().min(1).max(2000);
