import { describe, expect, it } from "vitest";
import type { PublishedJobOffer } from "../types/vacancy.types";
import { canApplyToVacancies } from "./can-apply-to-vacancies";
import { toVacancy } from "./to-vacancy";

const OFFER: PublishedJobOffer = {
  id: "offer-1",
  title: "DevOps Senior",
  description: "Infraestructura en la nube",
  category: "Tecnología",
  modality: "Híbrido",
  contractType: "Tiempo completo",
  status: "Publicada",
  positionsAvailable: 2,
  salaryRange: "Bs 6.500 - 8.000",
  languages: "Español, Inglés",
  locationUrl: "https://maps.app.goo.gl/abc",
  expiresAt: null,
  createdAt: "2026-10-12T15:00:00.000Z",
  company: { id: "company-1", name: "TechBolivia S.R.L." },
  skills: [{ id: "skill-1", name: "Docker" }, { id: "skill-2", name: "Kubernetes" }],
};

function tokenFor(payload: object): string {
  return `h.${btoa(JSON.stringify(payload))}.s`;
}

describe("toVacancy", () => {
  it("convierte una vacante publicada de la API al modelo del listado", () => {
    expect(toVacancy(OFFER)).toEqual({
      id: "offer-1",
      cargo: "DevOps Senior",
      empresa: "TechBolivia S.R.L.",
      descripcion: "Infraestructura en la nube",
      requisitos: ["Docker", "Kubernetes"],
      salario: "Bs 6.500 - 8.000",
      modalidad: "Híbrido",
      tipoContrato: "Tiempo completo",
      idiomas: "Español, Inglés",
      vacantes: 2,
      ubicacionUrl: "https://maps.app.goo.gl/abc",
    });
  });
});

describe("canApplyToVacancies", () => {
  it.each(["titulado", "estudiante"])("permite postular al rol %s", (roleTag) => {
    expect(canApplyToVacancies(tokenFor({ roleTag }))).toBe(true);
  });

  it.each(["mentor", "empresa"])("no permite postular al rol %s", (roleTag) => {
    expect(canApplyToVacancies(tokenFor({ roleTag }))).toBe(false);
  });

  it("no permite postular sin sesión", () => {
    expect(canApplyToVacancies(null)).toBe(false);
  });
});
