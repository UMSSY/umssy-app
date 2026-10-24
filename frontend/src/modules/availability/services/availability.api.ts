import type { BlockedDate } from "../types/blocked-date.types";
import type { BlockDateInput } from "../types/block-date-input.types";
import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { AvailabilityBlock } from "../types/availability-block.types";
import type { CreateAvailabilityBlockInput } from "../types/create-availability-block-input.types";
import type { AvailabilityFilters } from "../types/availability-filters.types";
import type { MentorAvailabilityStatus } from "../types/mentor-availability-status.types";
import type { WeekRange } from "@/shared/types/week-range.types";

function toISOString(value: string): string {
  return new Date(value).toISOString();
}

export const availabilityApi = {
  getBlockedDates: async (range: WeekRange): Promise<BlockedDate[]> => {
    const params = new URLSearchParams({ from: range.startAt, to: range.endAt });
    const response = await apiClient.get<ApiResponse<BlockedDate[]>>(
      `/blocked-dates?${params.toString()}`,
    );
    return response.data.data;
  },

  blockDate: async (input: BlockDateInput): Promise<BlockedDate> => {
    const response = await apiClient.post<ApiResponse<BlockedDate>>("/blocked-dates", input);
    return response.data.data;
  },

  unblockDate: async (id: string): Promise<void> => {
    await apiClient.delete(`/blocked-dates/${encodeURIComponent(id)}`);
  },

  getAvailabilityBlocks: async (filters?: AvailabilityFilters): Promise<AvailabilityBlock[]> => {
    const params = new URLSearchParams();
    if (filters?.from) params.append("from", toISOString(filters.from));
    if (filters?.to) params.append("to", toISOString(filters.to));
    const query = params.toString();
    const response = await apiClient.get<ApiResponse<AvailabilityBlock[]>>(
      `/availability-blocks${query ? `?${query}` : ""}`,
    );
    return response.data.data;
  },

  getMentorFreeBlocks: async (mentorId: string, range: WeekRange): Promise<AvailabilityBlock[]> => {
    const params = new URLSearchParams({ from: range.startAt, to: range.endAt });
    const response = await apiClient.get<ApiResponse<AvailabilityBlock[]>>(
      `/mentors/${encodeURIComponent(mentorId)}/free-blocks?${params.toString()}`,
    );
    return response.data.data;
  },

  getAvailabilityBlockById: async (id: string): Promise<AvailabilityBlock> => {
    const response = await apiClient.get<ApiResponse<AvailabilityBlock>>(`/availability-blocks/${id}`);
    return response.data.data;
  },

  createAvailabilityBlock: async (input: CreateAvailabilityBlockInput): Promise<AvailabilityBlock> => {
    const payload: CreateAvailabilityBlockInput = {
      startAt: toISOString(input.startAt),
      endAt: toISOString(input.endAt),
    };
    const response = await apiClient.post<ApiResponse<AvailabilityBlock>>("/availability-blocks", payload);
    return response.data.data;
  },

  updateAvailabilityBlock: async (id: string, input: Partial<CreateAvailabilityBlockInput>): Promise<AvailabilityBlock> => {
    const payload: Partial<CreateAvailabilityBlockInput> = {};
    if (input.startAt) payload.startAt = toISOString(input.startAt);
    if (input.endAt) payload.endAt = toISOString(input.endAt);
    const response = await apiClient.patch<ApiResponse<AvailabilityBlock>>(
      `/availability-blocks/${encodeURIComponent(id)}`,
      payload,
    );
    return response.data.data;
  },

  deleteAvailabilityBlock: async (id: string): Promise<void> => {
    await apiClient.delete(`/availability-blocks/${encodeURIComponent(id)}`);
  },

  getMyAvailabilityStatus: async (): Promise<MentorAvailabilityStatus> => {
    const response = await apiClient.get<ApiResponse<MentorAvailabilityStatus>>("/mentors/me/availability");
    return response.data.data;
  },

  updateAvailabilityStatus: async (mentorId: string, isAvailable: boolean): Promise<MentorAvailabilityStatus> => {
    const response = await apiClient.patch<ApiResponse<MentorAvailabilityStatus>>(
      `/mentors/${encodeURIComponent(mentorId)}/availability`,
      { isAvailable },
    );
    return response.data.data;
  },
};
