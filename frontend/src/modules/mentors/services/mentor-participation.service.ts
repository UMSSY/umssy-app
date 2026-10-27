import type { MyMentorParticipationResponse } from "../types/my-mentor-participation-response.types";
import type { MentorParticipationPreferencesPayload } from "../types/mentor-participation-preferences-payload.types";
import type { MentorCapacityResponse } from "../types/mentor-capacity-response.types";
import type { MentorParticipationRequestResponse } from "../types/mentor-participation-request-response.types";

import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import { clearMentorIntakeIntentions, withMentorIntakeKey } from "@/modules/mentorship";





const BASE_PATH = "/mentor-participation/requests";

export const mentorParticipationService = {
  async getMyParticipation(signal?: AbortSignal): Promise<MyMentorParticipationResponse> {
    const response = await apiClient.get<ApiResponse<MyMentorParticipationResponse>>(
      "/mentors/me/participation", { signal },
    );
    const result = response.data.data;
    const validItems = (items: unknown): items is { id: string; name: string }[] =>
      Array.isArray(items) && items.every((item: unknown) =>
        typeof item === "object" && item !== null &&
        "id" in item && typeof item.id === "string" &&
        "name" in item && typeof item.name === "string");
    if (!result || !["ACTIVE", "DEACTIVATED", "NEVER"].includes(result.status) ||
        !validItems(result.areas) || !validItems(result.orientations)) {
      throw new Error("Respuesta de participación inválida");
    }
    return result;
  },
  async capacity(): Promise<MentorCapacityResponse> {
    const response = await apiClient.get<ApiResponse<MentorCapacityResponse>>("/mentors/capacity");
    return response.data.data;
  },

  async confirm(offerId: string): Promise<void> {
    await apiClient.post(`/mentors/offers/${offerId}/confirm`);
    await clearMentorIntakeIntentions();
  },

  async leave(): Promise<void> {
    await apiClient.post("/mentors/me/leave");
    await clearMentorIntakeIntentions();
  },
  async getCurrent(): Promise<MentorParticipationRequestResponse | null> {
    const response = await apiClient.get<
      ApiResponse<MentorParticipationRequestResponse | null>
    >(`${BASE_PATH}/me`);

    return response.data.data;
  },

  async getHistory(): Promise<MentorParticipationRequestResponse[]> {
    const response = await apiClient.get<
      ApiResponse<MentorParticipationRequestResponse[]>
    >(`${BASE_PATH}/me/history`);

    return response.data.data;
  },

  async create(
    preferences: MentorParticipationPreferencesPayload,
  ): Promise<MentorParticipationRequestResponse> {
    return withMentorIntakeKey("request", preferences, async (key) => {
    const response = await apiClient.post<
      ApiResponse<MentorParticipationRequestResponse>
    >(BASE_PATH, preferences, { headers: { "Idempotency-Key": key } });

    return response.data.data;
    });
  },

  async update(
    preferences: MentorParticipationPreferencesPayload,
  ): Promise<MentorParticipationRequestResponse> {
    const response = await apiClient.patch<
      ApiResponse<MentorParticipationRequestResponse>
    >(`${BASE_PATH}/me`, preferences);

    return response.data.data;
  },

  async cancel(): Promise<MentorParticipationRequestResponse> {
    const response = await apiClient.delete<
      ApiResponse<MentorParticipationRequestResponse>
    >(`${BASE_PATH}/me`);

    await clearMentorIntakeIntentions(["request"]);
    return response.data.data;
  },
};
