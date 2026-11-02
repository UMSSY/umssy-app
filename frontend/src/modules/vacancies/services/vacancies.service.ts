import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import { PUBLISHED_JOB_OFFERS_ENDPOINT } from "../constants/vacancies.constants";
import type { Vacancy, PublishedJobOffer } from "../types/vacancy.types";
import { toVacancy } from "../utils/to-vacancy";

export const vacanciesService = {
  listPublished: async (): Promise<Vacancy[]> => {
    const response = await apiClient.get<ApiResponse<PublishedJobOffer[]>>(PUBLISHED_JOB_OFFERS_ENDPOINT);
    return response.data.data.map(toVacancy);
  },
};
