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
