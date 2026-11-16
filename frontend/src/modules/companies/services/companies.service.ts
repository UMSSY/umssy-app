import { apiClient } from "@/shared/services/api-client";
import { COMPANIES_REQUEST_TIMEOUT_MS, FEATURED_COMPANIES_LIMIT } from "../constants/companies.constants";
import { parseCompaniesResponse } from "../utils/company-response";
import type { CompanySummary } from "../types/company-summary.types";

export const companiesService = {
  async getFeaturedCompanies(signal?: AbortSignal): Promise<CompanySummary[]> {
    if (!apiClient.defaults.baseURL) throw new Error("La URL del backend no está configurada.");
    const response = await apiClient.get<unknown>("/companies/home-summary", {
      signal,
      timeout: COMPANIES_REQUEST_TIMEOUT_MS,
    });
    return parseCompaniesResponse(response.data)
      .filter((company) => company.activeVacanciesCount > 0)
      .slice(0, FEATURED_COMPANIES_LIMIT);
  },
};