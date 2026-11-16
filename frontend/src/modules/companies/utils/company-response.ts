import type { CompanySummary } from "../types/company-summary.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseCompanySummary(value: unknown): CompanySummary {
  if (!isRecord(value)) throw new Error("Respuesta de empresa inválida.");
  const { id, name, description, logoUrl, activeVacanciesCount } = value;
  if ((typeof id !== "string" && typeof id !== "number") || typeof name !== "string") {
    throw new Error("Respuesta de empresa inválida.");
  }
  if (typeof activeVacanciesCount !== "number" || !Number.isFinite(activeVacanciesCount) || activeVacanciesCount < 0) {
    throw new Error("Conteo de vacantes inválido.");
  }
  return {
    id: String(id),
    name,
    description: typeof description === "string" ? description : "",
    logoUrl: typeof logoUrl === "string" && logoUrl.trim() ? logoUrl : undefined,
    activeVacanciesCount,
  };
}

export function parseCompaniesResponse(body: unknown): CompanySummary[] {
  const list = Array.isArray(body) ? body : isRecord(body) && Array.isArray(body.data) ? body.data : null;
  if (!list) throw new Error("Respuesta de empresas inválida.");
  return list.map(parseCompanySummary);
}