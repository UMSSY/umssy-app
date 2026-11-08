import type { CurrentCompany } from "../types/current-company.types";
import { getSessionRoleTag } from "./get-session-role-tag";

function getInitials(name: string): string {
  const capitals = name.match(/[A-ZÁÉÍÓÚÑ]/g) ?? [];
  return capitals.slice(0, 2).join("") || name.slice(0, 2).toUpperCase();
}

// TODO: obtener la empresa desde la sesión cuando el login devuelva el companyId (Epic 1)
export function getCurrentCompany(): CurrentCompany {
  const name = process.env.NEXT_PUBLIC_DEMO_COMPANY_NAME?.trim() || "TechBolivia S.R.L.";
  const isCompanySession = getSessionRoleTag() === "empresa";
  const id = isCompanySession ? process.env.NEXT_PUBLIC_DEMO_COMPANY_ID?.trim() || "a0000000-0000-4000-8000-000000000001" : null;

  return { id, name, initials: getInitials(name) };
}
