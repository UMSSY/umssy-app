import { MOCK_COMPANY_PROFILE } from "../constants/company-mock.data";
import type { CompanyProfile } from "../types/company-profile.types";

export async function getCompanyProfile(): Promise<CompanyProfile> {
  return MOCK_COMPANY_PROFILE;
}