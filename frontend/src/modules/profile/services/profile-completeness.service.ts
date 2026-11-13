import { apiClient } from '@/shared/services/api-client';
import {
  PROFILE_COMPLETENESS_LIMITS,
  PROFILE_COMPLETENESS_MESSAGES,
  PROFILE_COMPLETENESS_SECTION_IDS,
} from '../constants/profile-completeness.constants';
import type { ApiResponse } from '../types/api-response.types';
import type { ProfileCompletenessResponse } from '../types/profile-completeness-response.types';
import { getAuthHeaders } from '../utils/get-auth-headers';

export const profileCompletenessService = {
  async getCompleteness(
    signal?: AbortSignal,
  ): Promise<ProfileCompletenessResponse> {
    const response = await apiClient.get<
      ApiResponse<ProfileCompletenessResponse>
    >('/profile/completeness', { headers: getAuthHeaders(), signal });
    const data = response.data?.data;

    if (
      response.data?.ok !== true ||
      !data ||
      !Number.isInteger(data.percentage) ||
      data.percentage < PROFILE_COMPLETENESS_LIMITS.min ||
      data.percentage > PROFILE_COMPLETENESS_LIMITS.max ||
      !Array.isArray(data.sections) ||
      data.sections.length !== PROFILE_COMPLETENESS_SECTION_IDS.length ||
      !data.sections.every(
        (section) =>
          section &&
          PROFILE_COMPLETENESS_SECTION_IDS.includes(section.id) &&
          typeof section.isCompleted === 'boolean' &&
          Number.isInteger(section.weight) &&
          section.weight >= PROFILE_COMPLETENESS_LIMITS.min &&
          section.weight <= PROFILE_COMPLETENESS_LIMITS.max,
      ) ||
      new Set(data.sections.map((section) => section.id)).size !==
        data.sections.length
    ) {
      throw new Error(PROFILE_COMPLETENESS_MESSAGES.invalidResponse);
    }

    return data;
  },
};
