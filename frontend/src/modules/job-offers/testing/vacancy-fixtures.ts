import type { VacancyConditions } from "../types/vacancy-conditions.types";
import type { JobOffer } from "../types/job-offer.types";

export const PYTHON = { id: "11111111-1111-4111-8111-111111111111", name: "Python" };
export const DOCKER = { id: "22222222-2222-4222-8222-222222222222", name: "Docker" };
export const KUBERNETES = { id: "33333333-3333-4333-8333-333333333333", name: "Kubernetes" };

export const COMPANY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

export function buildSessionToken(roleTag: string): string {
  return `header.${btoa(JSON.stringify({ sub: "user-id", roleTag }))}.signature`;
}

export const EMPTY_CONDITIONS: VacancyConditions = {
  title: "",
  modality: null,
  mapsLink: "",
  contractType: "",
  category: "",
  vacancyCount: "",
  salary: "",
  languages: "",
  description: "",
  skills: [],
};

export const VALID_CONDITIONS: VacancyConditions = {
  title: "DevOps Senior",
  modality: "Híbrido",
  mapsLink: "https://maps.app.goo.gl/TechBolivia",
  contractType: "Tiempo completo",
  category: "Tecnología",
  vacancyCount: "2",
  salary: "Bs 6.500 - 8.000",
  languages: "Español, inglés intermedio",
  description: "Buscamos un perfil DevOps con experiencia en Docker y Kubernetes.",
  skills: [DOCKER, KUBERNETES],
};

export function buildLongDescription(length: number): string {
  return "a".repeat(length);
}

export function buildJobOffer(overrides: Partial<JobOffer> = {}): JobOffer {
  return {
    id: "offer-1",
    title: "Desarrolladora Frontend",
    description: "Descripción de la vacante",
    category: "Tecnología",
    modality: "Remoto",
    contractType: "Tiempo completo",
    status: "Publicada",
    positionsAvailable: 1,
    salaryRange: "Bs 5.000 - 7.000",
    languages: "Español",
    locationUrl: "https://maps.app.goo.gl/TechBolivia",
    expiresAt: null,
    createdAt: "2026-10-12T00:00:00.000Z",
    company: { id: COMPANY_ID, name: "TechBolivia" },
    skills: [],
    applicantsCount: 0,
    ...overrides,
  };
}