import type { MentorProfileSuggestion } from '../types/mentor-profile-suggestion.types.js';
import type { MentorProfileSuggestionPresentation } from '../responses/mentor-profile-suggestions.response.js';

export const MENTOR_PROFILE_SUGGESTION_PRESENTATION = {
  MISSING_PROFILE_PHOTO: {
    title: 'Agrega tu fotografía',
    benefitDescription:
      'Ayuda a los estudiantes a reconocerte y conocer tu perfil.',
    editReference: { section: 'photoUrl', action: 'edit' },
  },
  MISSING_PROFESSIONAL_DESCRIPTION: {
    title: 'Completa tu descripción profesional',
    benefitDescription:
      'Presenta tu trayectoria y lo que puedes aportar como mentor.',
    editReference: { section: 'aboutMe', action: 'edit' },
  },
  MISSING_SPECIALTY: {
    title: 'Completa tus áreas técnicas',
    benefitDescription:
      'Ayuda a los estudiantes a identificar tus especialidades.',
    editReference: { section: 'mentorTechnicalAreas', action: 'edit' },
  },
  MISSING_WORK_EXPERIENCE: {
    title: 'Registra tu experiencia laboral',
    benefitDescription:
      'Muestra la experiencia práctica que puedes compartir en las mentorías.',
    editReference: { section: 'workExperiences', action: 'edit' },
  },
} as const satisfies {
  readonly [
    Code in MentorProfileSuggestion['code']
  ]: MentorProfileSuggestionPresentation<
    Extract<MentorProfileSuggestion, { code: Code }>['field']
  >;
};
