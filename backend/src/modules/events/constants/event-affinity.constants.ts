import type { RadarAreaId } from '../../profile/types/radar-area-id.type.js';

export const AFFINITY_WEIGHTS = {
  skills: 0.35,
  radar: 0.25,
  career: 0.1,
  interests: 0.1,
} as const;

export const POPULARITY_WEIGHT = 0.2;
export const RADAR_MAX_SCORE = 10;
export const SKILL_MATCH_SATURATION = 2;
export const INTEREST_MATCH_SATURATION = 3;
export const MIN_KEYWORD_LENGTH = 4;
export const INTERESTS_REASON = 'Tus intereses';

export const AFFINITY_STOPWORDS: ReadonlySet<string> = new Set([
  'para', 'como', 'sobre', 'desde', 'entre', 'donde', 'cuando', 'tambien',
  'pero', 'porque', 'este', 'esta', 'estos', 'estas', 'esto', 'tengo',
  'todo', 'todos', 'todas', 'mucho', 'mucha', 'cada', 'hacia', 'hasta',
  'mismo', 'otro', 'otra', 'otros', 'otras', 'segun', 'siempre', 'ahora',
  'nuevo', 'nueva', 'nuevos', 'nuevas', 'buscar', 'busco', 'quiero', 'gusta',
  'mejor', 'parte', 'forma', 'manera', 'ademas', 'durante', 'mediante',
  'with', 'from', 'that', 'this', 'have', 'about', 'your',
  'ingenieria', 'licenciatura', 'licenciado', 'licenciada', 'tecnico',
  'tecnica', 'tecnologo', 'carrera', 'grado', 'maestria', 'magister',
  'diplomado', 'doctorado', 'universidad', 'facultad', 'estudiante',
  'egresado', 'egresada', 'titulado', 'titulada', 'experiencia',
  'interesado', 'interesada', 'interes', 'intereses', 'apasionado',
  'apasionada', 'trabajo', 'trabajar', 'persona', 'profesional', 'anos',
  'taller', 'talleres', 'evento', 'eventos',
]);

export const RADAR_AREA_KEYWORDS: Record<RadarAreaId, readonly string[]> = {
  desarrollo: [
    'desarrollo', 'software', 'programacion', 'frontend', 'backend', 'web',
    'mobile', 'movil', 'aplicaciones', 'arquitectura de software',
  ],
  'cloud-devops': [
    'cloud', 'nube', 'devops', 'docker', 'kubernetes', 'contenedores',
    'despliegue', 'infraestructura', 'ci cd',
  ],
  'data-ai': [
    'datos', 'data', 'inteligencia artificial', 'machine learning', 'ia',
    'analitica', 'bases de datos', 'sql',
  ],
  qa: ['calidad', 'testing', 'pruebas', 'qa'],
  ciberseguridad: [
    'ciberseguridad', 'seguridad', 'pentesting', 'hacking', 'auditoria',
    'proteccion de datos',
  ],
  'gobernanza-ti': [
    'gestion de proyectos', 'agil', 'agiles', 'scrum', 'itil', 'liderazgo',
    'gobernanza',
  ],
};
