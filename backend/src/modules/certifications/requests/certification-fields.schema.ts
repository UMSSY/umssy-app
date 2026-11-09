import { z } from 'zod';

import { CERTIFICATION_VALIDATION_MESSAGES } from '../constants/certification.constants.js';

const BUSINESS_TIMEZONE = 'America/La_Paz';

const requiredText = () =>
  z
    .string({ error: CERTIFICATION_VALIDATION_MESSAGES.required })
    .trim()
    .min(1, CERTIFICATION_VALIDATION_MESSAGES.required)
    .refine((val) => !/<[^>]*>/i.test(val), {
      message: 'No se permiten etiquetas HTML ni scripts',
    });

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function todayInBolivia(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
  }).format(new Date());
}

export const certificationNameSchema = requiredText().max(
  150,
  CERTIFICATION_VALIDATION_MESSAGES.nameTooLong,
);

export const issuingOrganizationSchema = requiredText().max(
  150,
  CERTIFICATION_VALIDATION_MESSAGES.organizationTooLong,
);

export const issueDateSchema = z
  .string({ error: CERTIFICATION_VALIDATION_MESSAGES.required })
  .trim()
  .min(1, { error: CERTIFICATION_VALIDATION_MESSAGES.required, abort: true })
  .refine(isCalendarDate, {
    error: CERTIFICATION_VALIDATION_MESSAGES.invalidDate,
    abort: true,
  })
  .refine((value) => value >= '1950-01-01', {
    error: CERTIFICATION_VALIDATION_MESSAGES.minDate,
    abort: true,
  })
  .transform((value) => new Date(`${value}T00:00:00.000Z`))
  .refine((date) => date.toISOString().slice(0, 10) <= todayInBolivia(), {
    message: CERTIFICATION_VALIDATION_MESSAGES.futureDate,
  });
