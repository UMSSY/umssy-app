export const COMPANY_NAME_CHARACTERS = /^[\p{L}\p{N} &.,'’()-]+$/u;
export const COMPANY_NAME_HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
export const COMPANY_NAME_LENGTH_MESSAGE =
  'El nombre de la empresa debe tener entre 4 y 30 caracteres';
export const COMPANY_NAME_CHARACTERS_MESSAGE =
  'El nombre solo admite letras, números, espacios y los signos & . , - \' ( )';

export const DESCRIPTION_LENGTH_MESSAGE =
  'La descripción debe tener entre 10 y 500 caracteres';

export const WEBSITE_PATTERN = /^https?:\/\/.+\..+/;
export const WEBSITE_REQUIRED_MESSAGE = 'El sitio web es obligatorio';
export const WEBSITE_INVALID_MESSAGE =
  'Ingresa una URL válida (ej. https://www.empresa.com)';

export const BOLIVIAN_MOBILE_PATTERN = /^[67]\d{7}$/;
export const PHONE_MESSAGE = 'Ingresa un teléfono válido de 8 dígitos';

export const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{3,19}$/;
export const USERNAME_MESSAGE =
  'Debe contener entre 4 y 20 caracteres, comenzar con una letra y usar solo letras, números y guion bajo';

export const ALLOWED_LOGO_MIMES: ReadonlySet<string> = new Set([
  'image/png',
  'image/jpeg',
]);
export const COMPANY_LOGO_FORMAT_MESSAGE =
  'El logo debe estar en formato PNG o JPG';
