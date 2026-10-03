// Matches the VarChar(100) limit of users.first_name and users.last_name.
export const NAME_MAX_LENGTH = 100;

export const PHONE_MIN_DIGITS = 7;

export const PHONE_MAX_DIGITS = 15;

export const PROFILE_VALIDATION_MESSAGES = {
  required: "Este campo es obligatorio.",
  cityRequired: "Selecciona tu ciudad de residencia.",
  nameTooLong: `Usa como máximo ${NAME_MAX_LENGTH} caracteres.`,
  invalidPhone: `Ingresa un teléfono válido de ${PHONE_MIN_DIGITS} a ${PHONE_MAX_DIGITS} dígitos.`,
  invalidEmail: "Ingresa un correo válido, por ejemplo nombre@correo.com.",
};
