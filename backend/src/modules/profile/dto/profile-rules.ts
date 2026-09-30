import { z } from 'zod';

export const NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 150;
export const HEADLINE_MAX_LENGTH = 120;
export const ABOUT_ME_MIN_LENGTH = 20;
export const ABOUT_ME_MAX_LENGTH = 2000;
export const INTERESTED_OPPORTUNITIES_MAX_LENGTH = 1000;

export const PHOTO_MAX_SIZE_BYTES = 2 * 1024 * 1024;
export const PHOTO_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const NAME_PATTERN = /^[\p{L}\s'.-]+$/u;
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]*$/;
const PHONE_MIN_DIGITS = 7;
const PHONE_MAX_DIGITS = 15;

export function requiredText(label: string, min: number, max: number) {
  return z
    .string({ error: `${label} es obligatorio.` })
    .trim()
    .min(1, { error: `${label} es obligatorio.`, abort: true })
    .min(min, `${label} debe tener al menos ${min} caracteres.`)
    .max(max, `${label} no puede superar los ${max} caracteres.`);
}

export function personName(label: string) {
  return requiredText(label, 2, NAME_MAX_LENGTH).regex(
    NAME_PATTERN,
    `${label} solo puede contener letras y espacios.`,
  );
}

export const phoneNumber = z
  .string({ error: 'El teléfono es obligatorio.' })
  .trim()
  .min(1, { error: 'El teléfono es obligatorio.', abort: true })
  .regex(PHONE_PATTERN, {
    error: 'El teléfono solo puede contener números, espacios, guiones y +.',
    abort: true,
  })
  .refine((value) => {
    const digits = value.replace(/\D/g, '').length;
    return digits >= PHONE_MIN_DIGITS && digits <= PHONE_MAX_DIGITS;
  }, `El teléfono debe tener entre ${PHONE_MIN_DIGITS} y ${PHONE_MAX_DIGITS} dígitos.`);

export const emailAddress = z
  .string({ error: 'El correo personal es obligatorio.' })
  .trim()
  .min(1, { error: 'El correo personal es obligatorio.', abort: true })
  .max(
    EMAIL_MAX_LENGTH,
    `El correo no puede superar los ${EMAIL_MAX_LENGTH} caracteres.`,
  )
  .pipe(z.email('Ingresa un correo electrónico válido.'));
