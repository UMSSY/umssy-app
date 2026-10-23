export const JOB_OFFER_TITLE_MAX_LENGTH = 60;
export const JOB_OFFER_DESCRIPTION_MAX_LENGTH = 3000;
export const JOB_OFFER_LANGUAGES_MAX_LENGTH = 100;
export const JOB_OFFER_MAX_POSITIONS = 500;
export const JOB_OFFER_MAX_SKILLS = 10;
export const JOB_OFFER_MAX_SALARY = 999_999_999;
export const JOB_OFFER_SALARY_TO_BE_AGREED = 'A convenir';

export const JOB_OFFER_VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es obligatorio',
  TITLE_TOO_LONG: `El titulo del puesto no debe exceder los ${JOB_OFFER_TITLE_MAX_LENGTH} caracteres`,
  TITLE_INVALID_CHARACTERS: 'Solo se permiten caracteres alfanumericos y espacios',
  DESCRIPTION_TOO_LONG: `La descripcion no debe exceder los ${JOB_OFFER_DESCRIPTION_MAX_LENGTH} caracteres`,
  INVALID_MODALITY: 'Modalidad invalida',
  INVALID_CONTRACT_TYPE: 'Tipo de contrato invalido',
  POSITIONS_NOT_INTEGER: 'Debe ser un numero entero',
  POSITIONS_TOO_FEW: 'Debe ser al menos 1',
  POSITIONS_TOO_MANY: `El numero maximo de vacantes por publicacion es ${JOB_OFFER_MAX_POSITIONS}`,
  SALARY_NOT_POSITIVE: 'El salario debe ser mayor a 0',
  SALARY_TOO_HIGH: 'El salario no puede tener mas de 9 digitos',
  SALARY_RANGE_INVALID: 'El salario minimo no puede ser mayor al salario maximo',
  LANGUAGES_TOO_LONG: `Los idiomas no deben exceder los ${JOB_OFFER_LANGUAGES_MAX_LENGTH} caracteres`,
  INVALID_LOCATION_URL: 'Ingresa un enlace valido de Google Maps',
  SKILLS_REQUIRED: 'Debes seleccionar al menos una habilidad requerida',
  SKILLS_TOO_MANY: `No se pueden seleccionar mas de ${JOB_OFFER_MAX_SKILLS} habilidades`,
  INVALID_SKILL_ID: 'El identificador de la habilidad no es valido',
  INVALID_COMPANY_ID: 'El identificador de la empresa no es valido',
  INVALID_JOB_OFFER_ID: 'El identificador de la vacante no es valido',
  INVALID_DATE: 'La fecha debe tener el formato AAAA-MM-DD',
  DATE_RANGE_INVALID: 'La fecha inicial no puede ser mayor a la fecha final',
  INVALID_SORT_BY: 'Solo se puede ordenar por fecha o por postulantes',
  INVALID_SORT_ORDER: 'El orden debe ser ascendente o descendente',
  SEARCH_TOO_LONG: `La busqueda no debe exceder los ${JOB_OFFER_TITLE_MAX_LENGTH} caracteres`,
} as const;

export const JOB_OFFER_SORT_FIELDS = ['createdAt', 'applicants'] as const;
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
  createdAt: true,
  company: { select: { id: true, title: true } },
  modality: { select: { title: true } },
  contractType: { select: { title: true } },
  status: { select: { title: true } },
  skills: {
    select: { skill: { select: { id: true, name: true } } },
    orderBy: { skill: { name: 'asc' } },
  },
} as const;

export const JOB_OFFER_CREATED_SELECT = { id: true, createdAt: true } as const;
