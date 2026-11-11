import type { PersonalInfoValues } from "@/modules/profile";
import { PROFILE_SKILLS_RADAR_QUERY_KEY } from "@/modules/profile";
import type { CvContactField } from "../types/cv-contact-field.types";

export const CV_PERSONAL_INFO_FIELDS: Readonly<Record<CvContactField, keyof PersonalInfoValues>> = {
  firstName: "firstName",
  lastName: "lastName",
  email: "personalEmail",
  phone: "phone",
  cityId: "cityId",
};

export const CV_APPLY_INVALIDATED_QUERY_KEYS: readonly (readonly unknown[])[] = [
  ["profile", "me"],
  ["education", "educations"],
  ["work-experience", "experiences"],
  ["skills", "profile"],
  PROFILE_SKILLS_RADAR_QUERY_KEY,
];

export const CV_APPLY_TEXTS = {
  applying: "Aplicando...",
  success: "Se aplicaron los datos seleccionados a tu perfil.",
  partialTitle: "Algunos datos no se pudieron aplicar",
  appliedLabel: "Se aplicó:",
  failedLabel: "No se aplicó:",
  retryHint: "Revisa los datos que no se aplicaron y vuelve a intentarlo.",
  profileUnavailable: "No se pudo cargar tu perfil para aplicar los datos de contacto.",
} as const;
