import { getSessionRoles } from "@/modules/auth";
import { VACANCY_APPLICANT_ROLES } from "../constants/vacancies.constants";

export function canApplyWithRoles(roles: readonly string[]): boolean {
  return (VACANCY_APPLICANT_ROLES as readonly string[]).some((role) => roles.includes(role));
}

export function canApplyToVacancies(accessToken: string | null): boolean {
  return canApplyWithRoles(getSessionRoles(accessToken));
}
