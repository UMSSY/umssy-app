import { ApplicationStatus } from '../../applications/types/applications.types.js';

export const ACTIVE_APPLICATION_WHERE = {
  status: { title: { not: ApplicationStatus.WITHDRAWN } },
} as const;

export const JOB_OFFER_TITLE_MAX_LENGTH = 60;

export const JOB_OFFER_MAX_SKILLS = 10;

export const JOB_OFFER_VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es obligatorio',
  TITLE_TOO_LONG: `El título del puesto no debe exceder los ${JOB_OFFER_TITLE_MAX_LENGTH} caracteres`,
  TITLE_INVALID_CHARACTERS: 'Solo se permiten caracteres alfanuméricos y espacios',
  DESCRIPTION_TOO_LONG: `La descripción no debe exceder los 3000 caracteres`,
  INVALID_MODALITY: 'Modalidad inválida',
  INVALID_CONTRACT_TYPE: 'Tipo de contrato inválido',
  POSITIONS_NOT_INTEGER: 'Debe ser un número entero',
  POSITIONS_TOO_FEW: 'Debe ser al menos 1',
  POSITIONS_TOO_MANY: `El número máximo de vacantes por publicación es 500`,
  SALARY_NOT_POSITIVE: 'El salario debe ser mayor a 0',
  SALARY_TOO_HIGH: 'El salario no puede tener más de 9 dígitos',
  SALARY_RANGE_INVALID: 'El salario mínimo no puede ser mayor al salario máximo',
  LANGUAGES_TOO_LONG: `Los idiomas no deben exceder los 100 caracteres`,
  INVALID_LOCATION_URL: 'Ingresa un enlace válido de Google Maps',
  LOCATION_URL_TOO_LONG: `El enlace no debe exceder los 2048 caracteres`,
  CATEGORY_TOO_LONG: `La categoría no debe exceder los 100 caracteres`,
  SKILLS_REQUIRED: 'Debes seleccionar al menos una habilidad requerida',
  SKILLS_TOO_MANY: `No se pueden seleccionar más de ${JOB_OFFER_MAX_SKILLS} habilidades`,
  INVALID_SKILL_ID: 'El identificador de la habilidad no es válido',
  INVALID_COMPANY_ID: 'El identificador de la empresa no es válido',
  REQUIREMENT_TOO_LONG: `Cada requisito no debe exceder los 120 caracteres`,
  REQUIREMENTS_TOO_MANY: `No se pueden agregar más de 10 requisitos`,
  EXPERIENCE_NOT_INTEGER: 'Los años de experiencia deben ser un número entero',
  EXPERIENCE_OUT_OF_RANGE: `Los años de experiencia deben estar entre 0 y 40`,
  INVALID_JOB_OFFER_ID: 'El identificador de la vacante no es válido',
  INVALID_DATE: 'La fecha debe tener el formato AAAA-MM-DD',
  DATE_RANGE_INVALID: 'La fecha inicial no puede ser mayor a la fecha final',
  INVALID_SORT_BY: 'Solo se puede ordenar por fecha o por postulantes',
  INVALID_SORT_ORDER: 'El orden debe ser ascendente o descendente',
  SEARCH_TOO_LONG: `La búsqueda no debe exceder los ${JOB_OFFER_TITLE_MAX_LENGTH} caracteres`,
} as const;

export const JOB_OFFER_SORT_FIELDS = ['publishedAt', 'applicants'] as const;
export const JOB_OFFER_SORT_ORDERS = ['asc', 'desc'] as const;

export const JOB_OFFER_SELECT = {
  id: true,
  title: true,
  description: true,
  category: true,
  positionsAvailable: true,
  salaryRange: true,
  languages: true,
  locationUrl: true,
  expiresAt: true,
  publishedAt: true,
  createdAt: true,
  company: { select: { id: true, title: true } },
  modality: { select: { title: true } },
  contractType: { select: { title: true } },
  status: { select: { title: true } },
  skills: {
    select: { skill: { select: { id: true, name: true } } },
    orderBy: { skill: { name: 'asc' } },
  },
  _count: { select: { applications: { where: ACTIVE_APPLICATION_WHERE } } },
} as const;

export const JOB_OFFER_CREATED_SELECT = { id: true, createdAt: true } as const;
