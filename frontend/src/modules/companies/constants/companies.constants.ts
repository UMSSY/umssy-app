import type { CompanySummary } from "../types/company-summary.types";
export const FEATURED_COMPANIES_SKELETON_COUNT = 3;
export const FEATURED_COMPANIES_GRID_CLASS = "grid gap-5 md:grid-cols-3";
export const COMPANY_VACANCIES_HREF = "/jobs";

export const MOCK_FEATURED_COMPANIES: CompanySummary[] = [
  { id: "1", name: "Tecnosoft Bolivia", description: "Desarrollo de software a medida para banca y comercio electrónico.", activeVacanciesCount: 4 },
  { id: "2", name: "Andes Data", description: "Consultora de analítica de datos e inteligencia artificial aplicada a la industria, con proyectos en Cochabamba, La Paz y Santa Cruz, y un equipo joven que trabaja con tecnologías modernas y busca talento recién titulado de la UMSS.", logoUrl: "/images/campus-umss.webp", activeVacanciesCount: 12 },
  { id: "3", name: "Valle Cloud", description: "Infraestructura y servicios en la nube para empresas locales.", activeVacanciesCount: 1 },
];