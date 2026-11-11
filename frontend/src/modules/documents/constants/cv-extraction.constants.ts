import type { CvContactField } from "../types/cv-contact-field.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";

export const CV_CONTACT_FIELDS: readonly CvContactField[] = ["firstName", "lastName", "email", "phone", "location"];

export const CV_CONTACT_FIELD_LABELS: Readonly<Record<CvContactField, string>> = {
  firstName: "Nombres",
  lastName: "Apellidos",
  email: "Correo personal",
  phone: "Teléfono",
  location: "Ubicación",
};

export const CV_EXTRACTION_TABS = {
  contact: "contact",
  education: "education",
  experience: "experience",
} as const;

export const CV_EMPTY_EXTRACTION_SELECTION: CvExtractionSelection = {
  contactFields: [],
  educations: [],
  workExperiences: [],
};

export const CV_CURRENT_PERIOD_LABEL = "Actualidad";

export const CV_UNKNOWN_PERIOD_LABEL = "Sin fecha";
