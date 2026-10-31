import { getSessionRoles } from "@/modules/auth";
import { VACANCY_APPLICANT_ROLES } from "../constants/vacancies.constants";

export function canApplyToVacancies(accessToken: string | null): boolean {
  return getSessionRoles(accessToken).some((role) => VACANCY_APPLICANT_ROLES.includes(role));
}
