import { MOCK_FEATURED_COMPANIES } from "../constants/companies.constants";
import type { CompanySummary } from "../types/company-summary.types";

export const companiesService = {
  async getFeaturedCompanies(): Promise<CompanySummary[]> {
    return MOCK_FEATURED_COMPANIES;
  },
};