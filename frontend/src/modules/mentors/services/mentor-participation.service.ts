
import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";

export type MentorParticipationRequest = {
  id: string;
  userId: string;
  status: string;
  queuedAt: string;
  createdAt: string;
  technicalAreaIds: string[];
  orientationTypeIds: string[];
  email?: string;
  offer?: { id: string; status: string; offeredAt: string; expiresAt: string } | null;
};

export type MentorCapacity = {
  available: number;
  capacity: number;
  occupied: number;
};

export type MentorParticipationPreferences = {
  technicalAreaIds: string[];
  orientationTypeIds: string[];
};

export type MyMentorParticipation = {
  status: "ACTIVE" | "DEACTIVATED" | "NEVER";
  areas: { id: string; name: string }[];
  orientations: { id: string; name: string }[];
};

const BASE_PATH = "/mentor-participation/requests";

export const mentorParticipationService = {
  async getMyParticipation(signal?: AbortSignal): Promise<MyMentorParticipation> {
    const response = await apiClient.get<ApiResponse<MyMentorParticipation>>(
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
  async capacity(): Promise<MentorCapacity> {
    const response = await apiClient.get<ApiResponse<MentorCapacity>>("/mentors/capacity");
    return response.data.data;
  },

  async confirm(offerId: string): Promise<void> {
    await apiClient.post(`/mentors/offers/${offerId}/confirm`);
  },

  async leave(): Promise<void> {
    await apiClient.post("/mentors/me/leave");
  },
  async getCurrent(): Promise<MentorParticipationRequest | null> {
    const response = await apiClient.get<
      ApiResponse<MentorParticipationRequest | null>
    >(`${BASE_PATH}/me`);

    return response.data.data;
  },

  async getHistory(): Promise<MentorParticipationRequest[]> {
    const response = await apiClient.get<
      ApiResponse<MentorParticipationRequest[]>
    >(`${BASE_PATH}/me/history`);

    return response.data.data;
  },

  async create(
    preferences: MentorParticipationPreferences,
  ): Promise<MentorParticipationRequest> {
    const response = await apiClient.post<
      ApiResponse<MentorParticipationRequest>
    >(BASE_PATH, preferences);

    return response.data.data;
  },

  async update(
    preferences: MentorParticipationPreferences,
  ): Promise<MentorParticipationRequest> {
    const response = await apiClient.patch<
      ApiResponse<MentorParticipationRequest>
    >(`${BASE_PATH}/me`, preferences);

    return response.data.data;
  },

  async cancel(): Promise<MentorParticipationRequest> {
    const response = await apiClient.delete<
      ApiResponse<MentorParticipationRequest>
    >(`${BASE_PATH}/me`);

    return response.data.data;
  },
};
