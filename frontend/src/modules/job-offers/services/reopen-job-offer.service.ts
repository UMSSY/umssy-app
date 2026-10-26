import { apiClient } from "@/shared/services/api-client";

export async function reopenJobOffer(
  jobOfferId: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiClient.patch(`/job-offers/${jobOfferId}/reopen`, undefined, { signal });
}