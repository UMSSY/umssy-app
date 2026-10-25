import { apiClient } from "@/shared/services/api-client";

export async function deactivateMentorParticipation(): Promise<void> {
  await apiClient.delete("/mentors/me/participation");
}
