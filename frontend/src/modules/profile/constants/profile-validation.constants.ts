export const PHONE_MAX_DIGITS = 15;

export const PHONE_HINT =`De 7 a ${PHONE_MAX_DIGITS} dígitos. Puedes usar +, espacios o guiones.`;

export const PROFILE_VALIDATION_MESSAGES = {
  required: "Este campo es obligatorio.",
  cityRequired: "Selecciona tu ciudad de residencia.",
  nameTooLong: `Usa como máximo 100 caracteres.`,
  headlineTooLong: `Usa como máximo 150 caracteres.`,
  aboutMeTooLong: `Usa como máximo 2000 caracteres.`,
  invalidPhone: `Ingresa un teléfono válido de 7 a ${PHONE_MAX_DIGITS} dígitos.`,
  invalidEmail: "Ingresa un correo válido, por ejemplo nombre@correo.com.",
};

// The backend answers field errors in English; the form shows these Spanish texts instead.
export const PROFILE_SERVER_FIELD_MESSAGES = {
  firstName: `Ingresa tus nombres con hasta 100 caracteres.`,
  lastName: `Ingresa tus apellidos con hasta 100 caracteres.`,
  cityId: "Selecciona una ciudad válida.",
  phone: PROFILE_VALIDATION_MESSAGES.invalidPhone,
  personalEmail: PROFILE_VALIDATION_MESSAGES.invalidEmail,
  headline: `Ingresa un titular con hasta 150 caracteres.`,
  aboutMe: `Escribe tu presentación con hasta 2000 caracteres.`,
};
