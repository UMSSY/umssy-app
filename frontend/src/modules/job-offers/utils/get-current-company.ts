import type { CurrentCompany } from "../types/current-company.types";

function getInitials(name: string): string {
  const capitals = name.match(/[A-ZÁÉÍÓÚÑ]/g) ?? [];
  return capitals.slice(0, 2).join("") || name.slice(0, 2).toUpperCase();
}

export function getCurrentCompany(
  company: { id: string; name: string } | null = null,
): CurrentCompany {
  const name = company?.name ?? "Empresa sin asignar";
  return { id: company?.id ?? null, name, initials: getInitials(name) };
}
