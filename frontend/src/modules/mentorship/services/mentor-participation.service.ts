import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import { withIntakeKey } from "./mentor-intake-idempotency";

export type ParticipationStatus = "NONE" | "PENDING" | "OFFERED" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "LEFT";
export type ParticipationPreference = { id: string; name: string };
export type ParticipationState = {
  email: string | null;
  status: ParticipationStatus;
  sanction?: null | { startsAt: string; expiresAt: string };
  request: null | {
    id: string;
    requestedAt: string;
    queuedAt: string | null;
    technicalAreas: ParticipationPreference[];
    orientationTypes: ParticipationPreference[];
    offer: null | { id: string; status: string; offeredAt: string; expiresAt: string };
  };
};
export type ParticipationCapacity = {
  approvedGraduates: number;
  percentage: number;
  capacity: number;
  activeMentors: number;
  reservedOffers: number;
  occupied: number;
  available: number;
};
export type ParticipationPreferences = { technicalAreaIds: string[]; orientationTypeIds: string[] };

export async function getParticipation(signal?: AbortSignal): Promise<ParticipationState> {
  const response = await apiClient.get<ApiResponse<ParticipationState>>("/mentor-participation/me", { signal });
  return response.data.data;
}

export async function getCapacity(signal?: AbortSignal): Promise<ParticipationCapacity> {
  const response = await apiClient.get<ApiResponse<ParticipationCapacity>>("/mentor-participation/capacity", { signal });
  return response.data.data;
}

export async function requestParticipation(preferences: ParticipationPreferences) {
  return withIntakeKey("request", preferences, async (key) => {
    const response = await apiClient.post<ApiResponse<{ id: string }>>("/mentor-participation/requests", preferences,
      { headers: { "Idempotency-Key": key } });
    return response.data.data;
  });
}

export async function updateParticipationPreferences(preferences: ParticipationPreferences) {
  await apiClient.patch("/mentor-participation/me/preferences", preferences);
}

export async function cancelParticipation() {
  await apiClient.post("/mentor-participation/me/cancel");
}

export async function confirmOffer(id: string) {
  await apiClient.post(`/mentor-participation/offers/${encodeURIComponent(id)}/confirm`);
}

export async function leaveParticipation() {
  await apiClient.post("/mentor-participation/me/leave");
}
