export const PROFILE_COMPLETENESS_QUERY_KEY = [
  'profile',
  'completeness',
] as const;

export const PROFILE_COMPLETENESS_LIMITS = {
  min: 0,
  max: 100,
} as const;

export const PROFILE_COMPLETENESS_SECTION_IDS = [
  'contact',
  'presentation',
  'education',
  'work-experience',
  'skills',
  'certifications',
] as const;

export const PROFILE_COMPLETENESS_MESSAGES = {
  label: 'Completitud del perfil',
  checklistTrigger: 'Ver secciones del perfil',
  checklistTitle: 'Secciones del perfil',
  sectionCount: '{completed} de {total} secciones completadas',
  completed: 'Completada',
  pending: 'Pendiente',
  unavailableSections: 'No se pudo obtener el estado de las secciones.',
  initialTitle: 'Completa tu perfil profesional',
  progressTitle: 'Tu perfil está tomando forma',
  progressDescription: 'Continúa completando las secciones pendientes.',
  completedTitle: 'Perfil completado',
  completedDescription:
    'Has completado las secciones de tu perfil profesional.',
  loading: 'Cargando el progreso de tu perfil...',
  error: 'No se pudo cargar el progreso de tu perfil. Intenta de nuevo.',
  retry: 'Reintentar',
  invalidResponse: 'Invalid profile completeness response',
} as const;

export const PROFILE_COMPLETENESS_SECTION_LABELS = {
  contact: 'Datos de contacto',
  presentation: 'Presentación',
  education: 'Formación académica',
  'work-experience': 'Experiencia laboral',
  skills: 'Habilidades',
  certifications: 'Certificaciones',
} as const;
