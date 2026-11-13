export const HEATMAP_TYPES = [
  'skills-by-career',
  'skills-by-salary',
  'employability',
  'skills-by-experience',
] as const;

export const BOLIVIA_UTC_OFFSET = '-04:00';
export const BOLIVIA_UTC_OFFSET_MS = -4 * 3_600_000;
export const MS_PER_YEAR = 365.25 * 24 * 3_600_000;
export const MAX_HEATMAP_SKILL_ROWS = 10;
export const NLP_SKILL_SOURCE = 'nlp';

// Las analíticas leen las respuestas de cualquier encuesta que use estos enunciados.
export const EMPLOYMENT_STATUS_QUESTION =
  '¿Cuál es tu situación laboral actual respecto a tu carrera?';
export const MONTHLY_SALARY_QUESTION = '¿Cuál es tu rango salarial mensual?';

export const EMPLOYMENT_STATUSES = [
  { id: 'employed-in-field', label: 'Empleado en su área', retains: true },
  { id: 'employed-other-field', label: 'Empleado en otra área', retains: true },
  { id: 'self-employed', label: 'Independiente', retains: true },
  { id: 'job-seeking', label: 'Buscando empleo', retains: false },
] as const;

export const SALARY_RANGES = [
  { id: 'up-to-3000', label: 'Hasta Bs 3.000' },
  { id: '3000-5000', label: 'Más de Bs 3.000 y hasta Bs 5.000' },
  { id: '5000-8000', label: 'Más de Bs 5.000 y hasta Bs 8.000' },
  { id: '8000-12000', label: 'Más de Bs 8.000 y hasta Bs 12.000' },
  { id: 'over-12000', label: 'Más de Bs 12.000' },
] as const;

export const EXPERIENCE_LEVELS = [
  { id: 'junior', label: 'Junior', range: 'hasta 2 años', minExclusive: Number.NEGATIVE_INFINITY, max: 2 },
  { id: 'semi-senior', label: 'Semi-Senior', range: '2 a 5 años', minExclusive: 2, max: 5 },
  { id: 'senior', label: 'Senior', range: 'más de 5 años', minExclusive: 5, max: Number.POSITIVE_INFINITY },
] as const;

export const HEATMAP_EXTRA_COLUMNS = {
  totalGraduates: { id: 'total_graduates', label: 'Total titulados', sublabel: 'con la habilidad', format: 'count' },
  jobRetention: { id: 'job_retention', label: 'Retención laboral', sublabel: 'empleados o independientes', format: 'percentage' },
  totalMastering: { id: 'total_mastering', label: 'Total que la dominan', format: 'count' },
  highestAdoption: { id: 'highest_adoption', label: 'Mayor adopción en', sublabel: 'nivel con más %', format: 'badge' },
} as const;

export const HEATMAP_BASE_LABELS = {
  'skills-by-career': 'egresados con habilidades técnicas registradas',
  'skills-by-salary': 'titulados con rango salarial registrado',
  employability: 'titulados con encuesta de empleabilidad respondida',
  'skills-by-experience': 'titulados con experiencia laboral registrada',
} as const;
