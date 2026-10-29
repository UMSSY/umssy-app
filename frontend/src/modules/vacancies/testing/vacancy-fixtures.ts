import type { Vacancy } from "../types/vacancy.types";

export function buildVacancy(overrides: Partial<Vacancy> = {}): Vacancy {
  return {
    id: "d85930ba-0462-4fa2-9856-cdaf8aabfc86",
    cargo: "Desarrollador Full Stack",
    empresa: "TechBolivia S.R.L.",
    descripcion: "Desarrollo de servicios web con Node.js y React.",
    requisitos: ["Node.js", "React"],
    salario: "Bs 5.000 - 8.000",
    modalidad: "Presencial",
    tipoContrato: "Medio tiempo",
    idiomas: "Español",
    vacantes: 1,
    ubicacionUrl: "https://maps.app.goo.gl/abc123",
    ...overrides,
  };
}
