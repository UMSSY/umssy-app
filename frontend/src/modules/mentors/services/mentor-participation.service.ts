import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";

export type MentorParticipation = {
  isActive: boolean;
  technicalAreaIds: string[];
  orientationTypeIds: string[];
  areas: string[];
  orientations: string[];
};

export async function getMentorParticipation(
  signal?: AbortSignal,
): Promise<MentorParticipation> {
  const response = await apiClient.get<ApiResponse<MentorParticipation>>(
    "/mentors/me/participation",
    { signal },
  );
  return response.data.data;
}

export async function updateMentorParticipation(
  isActive: boolean,
): Promise<void> {
  await apiClient.patch("/mentors/me/participation", { isActive });
}
