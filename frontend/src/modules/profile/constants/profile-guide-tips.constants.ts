import type { ProfileCompletenessSectionId } from '../types/profile-completeness-section-id.types';

export const PROFILE_GUIDE_ASSISTANT_MESSAGES = {
  title: 'Asistente UMSSY',
  subtitle: 'Guía de perfil',
  nextStep: 'Siguiente paso',
  lastStep: 'Revisar pendientes',
} as const;

export const PROFILE_GUIDE_SECTION_TIPS = {
  contact:
    'Agrega tu teléfono y tu ciudad para que puedan contactarte con facilidad.',
  presentation:
    'Resume en pocas líneas quién eres y qué te distingue como profesional.',
  education:
    'Registra tus estudios con su institución y fechas, empezando por el más reciente.',
  'work-experience':
    'Describe tus cargos y logros concretos, empezando por el más reciente.',
  skills: 'Elige las habilidades que mejor reflejan tu perfil profesional.',
  certifications:
    'Agrega los cursos y certificados que respaldan tus conocimientos.',
  cv: 'Sube tu CV actualizado para compartirlo cuando postules.',
} as const satisfies Record<ProfileCompletenessSectionId, string>;
