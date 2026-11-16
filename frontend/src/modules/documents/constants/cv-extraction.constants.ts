import type { CvContactField } from "../types/cv-contact-field.types";
import type { CvExtractionSection } from "../types/cv-extraction-section.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";

export const CV_CONTACT_FIELDS: readonly CvContactField[] = ["firstName", "lastName", "email", "phone", "cityId"];

export const CV_CONTACT_FIELD_LABELS: Readonly<Record<CvContactField, string>> = {
  firstName: "Nombres",
  lastName: "Apellidos",
  email: "Correo personal",
  phone: "Teléfono",
  cityId: "Ciudad de residencia",
};

export const CV_EXTRACTION_SECTIONS: readonly CvExtractionSection[] = [
  "contact",
  "presentation",
  "education",
  "experience",
  "skills",
];

export const CV_EXTRACTION_SECTION_LABELS: Readonly<Record<CvExtractionSection, string>> = {
  contact: "Contacto",
  presentation: "Presentación",
  education: "Formación académica",
  experience: "Experiencia laboral",
  skills: "Habilidades técnicas",
};

export const CV_EXTRACTION_EMPTY_MESSAGES: Readonly<Record<CvExtractionSection, string>> = {
  contact: "No encontramos datos de contacto en tu CV.",
  presentation: "No encontramos una presentación profesional en tu CV.",
  education: "No encontramos estudios en tu CV.",
  experience: "No encontramos experiencia laboral en tu CV.",
  skills: "No encontramos habilidades técnicas del catálogo en tu CV.",
};

export const CV_EMPTY_EXTRACTION_SELECTION: CvExtractionSelection = {
  contact: [],
  presentation: [],
  education: [],
  experience: [],
  skills: [],
};

export const CV_PRESENTATION_INDEX = 0;

export const CV_PRESENTATION_LIMITS = {
  headline: 150,
  aboutMe: 2000,
} as const;

export const CV_REVIEW_TEXTS = {
  title: "Revisar datos extraídos del CV",
  description: "Corrige los datos y marca las secciones que quieres incorporar. Solo se aplicará lo seleccionado.",
  loading: "Leyendo los datos de tu CV...",
  apply: "Aplicar a mi perfil",
  cancel: "Cancelar",
  incomplete: "Incompleto",
  headlineLabel: "Titular",
  headlinePlaceholder: "Ej. Ingeniero de Sistemas",
  headlineRequired: "Ingresa un titular para aplicar tu presentación.",
  aboutMeLabel: "Acerca de mí",
  locationHint: "En tu CV:",
  cityPlaceholder: "Selecciona tu ciudad",
  institutionLabel: "Institución",
  degreeLabel: "Título o grado",
  companyLabel: "Empresa",
  positionLabel: "Cargo",
  startDateLabel: "Fecha de inicio",
  endDateLabel: "Fecha de fin",
  descriptionLabel: "Descripción",
  untitledEducation: "Estudio sin título",
  untitledExperience: "Experiencia sin cargo",
} as const;

export const CV_WORK_EXPERIENCE_CURRENT_LABEL = "Trabajo actualmente aquí";

export const CV_CURRENT_PERIOD_LABEL = "Actualidad";

export const CV_UNKNOWN_PERIOD_LABEL = "Sin fecha";

export const CV_EXTRACTION_FALLBACK_TEXTS = {
  errorTitle: "No pudimos autollenar tu perfil",
  emptyTitle: "No detectamos datos en tu CV",
  emptyMessage:
    "Leímos tu CV, pero no encontramos contacto, presentación, estudios, experiencia ni habilidades que podamos reconocer. Puedes completar tu perfil a mano.",
  retry: "Reintentar",
  manualFill: "Llenar mi perfil a mano",
} as const;

export const CV_MANUAL_FILL_HREF = "/profile";
