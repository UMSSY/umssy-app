import type {
  FieldErrors,
  PersonalInfoValues,
  PresentationValues,
} from "../types/profile.types";

// Keep these rules aligned with backend/src/modules/profile/dto/profile-rules.ts
export const NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 150;
export const HEADLINE_MAX_LENGTH = 120;
export const ABOUT_ME_MIN_LENGTH = 20;
export const ABOUT_ME_MAX_LENGTH = 2000;
export const INTERESTED_OPPORTUNITIES_MAX_LENGTH = 1000;
export const PHOTO_MAX_SIZE_BYTES = 2 * 1024 * 1024;
export const PHOTO_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const NAME_PATTERN = /^[\p{L}\s'.-]+$/u;
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_MIN_DIGITS = 7;
const PHONE_MAX_DIGITS = 15;

function validateRequiredText(
  value: string,
  label: string,
  min: number,
  max: number,
): string | undefined {
  const text = value.trim();

  if (!text) {
    return `${label} es obligatorio.`;
  }
  if (text.length < min) {
    return `${label} debe tener al menos ${min} caracteres.`;
  }
  if (text.length > max) {
    return `${label} no puede superar los ${max} caracteres.`;
  }
  return undefined;
}

function validatePersonName(value: string, label: string): string | undefined {
  const error = validateRequiredText(value, label, 2, NAME_MAX_LENGTH);

  if (error) {
    return error;
  }
  if (!NAME_PATTERN.test(value.trim())) {
    return `${label} solo puede contener letras y espacios.`;
  }
  return undefined;
}

function validatePhone(value: string): string | undefined {
  const phone = value.trim();

  if (!phone) {
    return "El teléfono es obligatorio.";
  }
  if (!PHONE_PATTERN.test(phone)) {
    return "El teléfono solo puede contener números, espacios, guiones y +.";
  }

  const digits = phone.replace(/\D/g, "").length;
  if (digits < PHONE_MIN_DIGITS || digits > PHONE_MAX_DIGITS) {
    return `El teléfono debe tener entre ${PHONE_MIN_DIGITS} y ${PHONE_MAX_DIGITS} dígitos.`;
  }
  return undefined;
}

function validateEmail(value: string): string | undefined {
  const email = value.trim();

  if (!email) {
    return "El correo personal es obligatorio.";
  }
  if (email.length > EMAIL_MAX_LENGTH) {
    return `El correo no puede superar los ${EMAIL_MAX_LENGTH} caracteres.`;
  }
  if (!EMAIL_PATTERN.test(email)) {
    return "Ingresa un correo electrónico válido.";
  }
  return undefined;
}

function removeEmpty<T>(errors: FieldErrors<T>): FieldErrors<T> {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message)),
  ) as FieldErrors<T>;
}

export function validatePersonalInfo(
  values: PersonalInfoValues,
): FieldErrors<PersonalInfoValues> {
  return removeEmpty<PersonalInfoValues>({
    firstName: validatePersonName(values.firstName, "El nombre"),
    lastName: validatePersonName(values.lastName, "El apellido"),
    cityId: values.cityId ? undefined : "Selecciona tu ciudad de residencia.",
    phone: validatePhone(values.phone),
    personalEmail: validateEmail(values.personalEmail),
  });
}

export function validatePresentation(
  values: PresentationValues,
): FieldErrors<PresentationValues> {
  const opportunities = values.interestedOpportunities.trim();

  return removeEmpty<PresentationValues>({
    headline: validateRequiredText(
      values.headline,
      "El titular profesional",
      3,
      HEADLINE_MAX_LENGTH,
    ),
    aboutMe: validateRequiredText(
      values.aboutMe,
      'El campo "Acerca de"',
      ABOUT_ME_MIN_LENGTH,
      ABOUT_ME_MAX_LENGTH,
    ),
    interestedOpportunities:
      opportunities.length > INTERESTED_OPPORTUNITIES_MAX_LENGTH
        ? `Las oportunidades de interés no pueden superar los ${INTERESTED_OPPORTUNITIES_MAX_LENGTH} caracteres.`
        : undefined,
  });
}

export function validatePhotoFile(file: File): string | undefined {
  if (!PHOTO_ALLOWED_TYPES.includes(file.type)) {
    return "La fotografía debe ser una imagen JPG, PNG o WEBP.";
  }
  if (file.size > PHOTO_MAX_SIZE_BYTES) {
    return "La fotografía no puede superar los 2 MB.";
  }
  return undefined;
}

export function hasErrors<T>(errors: FieldErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}
