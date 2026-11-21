import { apiClient } from '@/shared/services/api-client';
import type { ApiResponse } from '@/shared/types/api-response.types';

const SECTIONS = {
  MISSING_PROFILE_PHOTO: 'photoUrl',
  MISSING_PROFESSIONAL_DESCRIPTION: 'aboutMe',
  MISSING_SPECIALTY: 'mentorTechnicalAreas',
  MISSING_WORK_EXPERIENCE: 'workExperiences',
} as const;

export type MentorProfileSuggestion = {
  code: keyof typeof SECTIONS;
  field: (typeof SECTIONS)[keyof typeof SECTIONS];
  message: string;
  title: string;
  benefitDescription: string;
  editReference: {
    section: (typeof SECTIONS)[keyof typeof SECTIONS];
    action: 'edit';
  };
};
export type MentorProfileSuggestions = {
  suggestions: MentorProfileSuggestion[];
  pendingCount: number;
};

export const mentorProfileSuggestionsService = {
  async getMySuggestions(
    signal?: AbortSignal,
  ): Promise<MentorProfileSuggestions> {
    const response = await apiClient.get<ApiResponse<MentorProfileSuggestions>>(
      '/mentors/me/profile-suggestions',
      { signal },
    );
    const data = response.data.data;
    if (
      !response.data.ok ||
      !data ||
      !Array.isArray(data.suggestions) ||
      data.pendingCount !== data.suggestions.length ||
      new Set(data.suggestions.map((item) => item?.code)).size !==
        data.suggestions.length ||
      !data.suggestions.every(
        (item) =>
          item &&
          Object.hasOwn(SECTIONS, item.code) &&
          item.field === SECTIONS[item.code] &&
          item.editReference?.section === SECTIONS[item.code] &&
          item.editReference.action === 'edit' &&
          [item.title, item.message, item.benefitDescription].every(
            (text) => typeof text === 'string' && text.trim().length > 0,
          ),
      )
    ) {
      throw new Error('Respuesta de recomendaciones inválida');
    }
    return data;
  },
};
