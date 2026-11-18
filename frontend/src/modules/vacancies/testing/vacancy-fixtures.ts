import type { Vacancy } from "../types/vacancy.types";

export function buildVacancy(overrides: Partial<Vacancy> = {}): Vacancy {
  return {
    id: "d85930ba-0462-4fa2-9856-cdaf8aabfc86",
    title: "Desarrollador Full Stack",
    companyName: "TechBolivia S.R.L.",
    description: "Desarrollo de servicios web con Node.js y React.",
    requirements: ["Node.js", "React"],
    salary: "Bs 5.000 - 8.000",
    modality: "Presencial",
    contractType: "Medio tiempo",
    languages: "Español",
    positionsAvailable: 1,
    locationUrl: "https://maps.app.goo.gl/abc123",
    publishedAt: "2026-11-10T15:00:00.000Z",
    expiresAt: "2026-11-29T15:00:00.000Z",
    ...overrides,
  };
}
