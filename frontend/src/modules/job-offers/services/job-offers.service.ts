import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type {
  CreateJobOfferPayload,
  JobOffer,
  JobOfferCreatedResponse,
} from "../types/job-offer.types";
import type { SkillOption } from "../types/vacancy-conditions.types";
import type { JobOfferListParams } from "../utils/filter-job-offers";

const SKILL_CATALOG_ENDPOINT = "/job-offers/skills";

function buildCompanyJobOffersEndpoint(companyId: string): string {
  return `/companies/${companyId}/job-offers`;
}

export const jobOffersService = {
  getSkillCatalog: async (): Promise<SkillOption[]> => {
    const response = await apiClient.get<ApiResponse<SkillOption[]>>(SKILL_CATALOG_ENDPOINT);
    return (response.data.data ?? []).map(({ id, name }) => ({ id, name }));
  },

  publish: async (
    companyId: string,
    payload: CreateJobOfferPayload,
  ): Promise<JobOfferCreatedResponse> => {
    const response = await apiClient.post<ApiResponse<JobOfferCreatedResponse>>(
      buildCompanyJobOffersEndpoint(companyId),
      payload,
    );
    return response.data.data;
  },

  getByCompany: async (companyId: string, params?: JobOfferListParams): Promise<JobOffer[]> => {
    const response = await apiClient.get<
      ApiResponse<Array<Omit<JobOffer, "applicantsCount"> & { applicantsCount?: number }>>
    >(buildCompanyJobOffersEndpoint(companyId), { params });
    return (response.data.data ?? []).map((offer) => ({
      id: offer.id,
      title: offer.title,
      modality: offer.modality,
      contractType: offer.contractType,
      status: offer.status,
      createdAt: offer.createdAt,
      applicantsCount: offer.applicantsCount ?? 0,
    }));
  },
};