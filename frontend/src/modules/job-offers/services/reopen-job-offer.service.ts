import { apiClient } from "@/shared/services/api-client";

export async function reopenJobOffer(
  companyId: string,
  jobOfferId: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiClient.patch(
    `/companies/${companyId}/job-offers/${jobOfferId}/reopen`,
    {},
    { signal },
  );
}