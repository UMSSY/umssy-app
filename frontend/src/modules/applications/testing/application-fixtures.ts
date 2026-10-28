import type { Application } from "../types/application.types";

export function buildApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: "application-1",
    vacancyTitle: "Desarrollador Backend Python / FastAPI",
    companyName: "TechBolivia S.R.L.",
    affinityPercentage: 92,
    status: "En revisión",
    appliedDate: "2026-10-20",
    ...overrides,
  };
}
