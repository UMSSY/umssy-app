import { apiClient } from '@/shared/services/api-client';
import type { ApiResponse } from '@/shared/types/api-response.types';
import type {
  MentorCapacityOverview,
  MentorCapacityPage,
  MentorOfferRecord,
  WaitingMentorRequest,
} from '../types/mentor-capacity.types';

const BASE_PATH = '/admin/mentor-capacity';
const PAGE_SIZE = 10;

export const mentorCapacityService = {
  async getOverview(signal?: AbortSignal): Promise<MentorCapacityOverview> {
    const response = await apiClient.get<ApiResponse<MentorCapacityOverview>>(
      BASE_PATH,
      { signal },
    );
    return response.data.data;
  },

  async updatePercentage(percentage: number): Promise<MentorCapacityOverview> {
    const response = await apiClient.put<ApiResponse<MentorCapacityOverview>>(
      BASE_PATH,
      { percentage },
    );
    return response.data.data;
  },

  async getWaitingRequests(
    page: number,
    signal?: AbortSignal,
  ): Promise<MentorCapacityPage<WaitingMentorRequest>> {
    const response = await apiClient.get<
      ApiResponse<MentorCapacityPage<WaitingMentorRequest>>
    >(`${BASE_PATH}/requests`, {
      params: { page, limit: PAGE_SIZE },
      signal,
    });
    return response.data.data;
  },

  async getOfferHistory(
    page: number,
    signal?: AbortSignal,
  ): Promise<MentorCapacityPage<MentorOfferRecord>> {
    const response = await apiClient.get<
      ApiResponse<MentorCapacityPage<MentorOfferRecord>>
    >(`${BASE_PATH}/offers`, {
      params: { page, limit: PAGE_SIZE },
      signal,
    });
    return response.data.data;
  },
};

export { PAGE_SIZE as MENTOR_CAPACITY_PAGE_SIZE };
