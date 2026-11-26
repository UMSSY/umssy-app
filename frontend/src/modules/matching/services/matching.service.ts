import { apiClient } from "@/shared/services/api-client";
import type { CompanyApplicantsResponse } from "../types/company-applicants-response.types";

export async function getCompanyApplicants(
  companyId: string,
  jobOfferId: string,
  signal?: AbortSignal,
): Promise<CompanyApplicantsResponse> {
  const response = await apiClient.get<{ data: CompanyApplicantsResponse }>(
    `/companies/${encodeURIComponent(companyId)}/job-offers/${encodeURIComponent(jobOfferId)}/applications`,
    { signal },
  );
  return response.data.data;
}
