import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { JobOffer } from "../types/job-offer.types";
import type { CreateJobOfferPayload } from "../types/create-job-offer-payload.types";
import type { JobOfferCreatedResponse } from "../types/job-offer-created-response.types";
import type { JobOfferDetailsResponse } from "../types/job-offer-details-response.types";
import type { SkillOption } from "../types/skill-option.types";
import type { JobOfferListParams } from "../types/job-offer-list-params.types";

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
      ApiResponse<Array<JobOfferDetailsResponse & { applicantsCount?: number }>>
    >(buildCompanyJobOffersEndpoint(companyId), { params });
    return (response.data.data ?? []).map((offer) => ({
      ...offer,
      applicantsCount: offer.applicantsCount ?? 0,
    }));
  },

  getByCompanyAndId: async (
    companyId: string,
    jobOfferId: string,
  ): Promise<JobOfferDetailsResponse> => {
    const response = await apiClient.get<ApiResponse<JobOfferDetailsResponse>>(
      `${buildCompanyJobOffersEndpoint(companyId)}/${jobOfferId}`,
    );
    return response.data.data;
  },

  reopen: async (companyId: string, jobOfferId: string): Promise<JobOfferDetailsResponse> => {
    const response = await apiClient.patch<ApiResponse<JobOfferDetailsResponse>>(
      `${buildCompanyJobOffersEndpoint(companyId)}/${jobOfferId}/reopen`,
    );
    return response.data.data;
  },

  remove: async (companyId: string, jobOfferId: string): Promise<void> => {
    await apiClient.delete(`${buildCompanyJobOffersEndpoint(companyId)}/${jobOfferId}`);
  },

  update: async (
    companyId: string,
    jobOfferId: string,
    payload: CreateJobOfferPayload,
  ): Promise<JobOfferDetailsResponse> => {
    const response = await apiClient.put<ApiResponse<JobOfferDetailsResponse>>(
      `${buildCompanyJobOffersEndpoint(companyId)}/${jobOfferId}`,
      payload,
    );
    return response.data.data;
  },
};
