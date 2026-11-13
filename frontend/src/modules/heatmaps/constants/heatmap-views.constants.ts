import type { HeatmapType } from "../types/heatmap.types";
import type { HeatmapViewConfig } from "../types/heatmap-view-config.types";
import {
  EMPLOYABILITY_HEATMAP_PATH,
  SKILLS_BY_CAREER_HEATMAP_PATH,
  SKILLS_BY_EXPERIENCE_HEATMAP_PATH,
  SKILLS_BY_SALARY_HEATMAP_PATH,
} from "./heatmap-routes.constants";

export const HEATMAP_VIEW_CONFIGS: Record<HeatmapType, HeatmapViewConfig> = {
  "skills-by-career": {
    type: "skills-by-career",
    path: SKILLS_BY_CAREER_HEATMAP_PATH,
    navLabel: "Habilidades por Carrera",
    title: "Habilidades técnicas por carrera",
    subtitle: "Compara la presencia de tecnologías entre egresados de Ingeniería de Sistemas e Ingeniería Informática.",
    cellFormat: "count-first",
    cellUnit: "egresados",
    showCareerFilter: false,
    showMonthFilter: false,
    emptyMessage: "No hay egresados con habilidades técnicas registradas para los filtros seleccionados.",
  },
  "skills-by-salary": {
    type: "skills-by-salary",
    path: SKILLS_BY_SALARY_HEATMAP_PATH,
    navLabel: "Habilidades vs. Rango Salarial",
    title: "Habilidades NLP vs. rango salarial",
    subtitle: "Relaciona las tecnologías extraídas por NLP de los perfiles con el nivel de ingresos mensuales de los titulados.",
    cellFormat: "count-first",
    cellUnit: "titulados",
    showCareerFilter: true,
    showMonthFilter: false,
    emptyMessage: "No hay titulados con salario y habilidades NLP registradas para los filtros seleccionados.",
  },
  employability: {
    type: "employability",
    path: EMPLOYABILITY_HEATMAP_PATH,
    navLabel: "Empleabilidad y Habilidades",
    title: "Empleabilidad y habilidades técnicas",
    subtitle: "Analiza la inserción laboral de los titulados según las habilidades técnicas que dominan.",
    cellFormat: "percentage-first",
    cellUnit: "titulados",
    showCareerFilter: true,
    showMonthFilter: false,
    emptyMessage: "No hay titulados con encuesta de empleabilidad respondida para los filtros seleccionados.",
  },
  "skills-by-experience": {
    type: "skills-by-experience",
    path: SKILLS_BY_EXPERIENCE_HEATMAP_PATH,
    navLabel: "Habilidades vs. Experiencia",
    title: "Habilidades vs. años de experiencia",
    subtitle: "Identifica la adopción tecnológica según el nivel de madurez profesional de los titulados.",
    cellFormat: "percentage-first",
    cellUnit: "titulados",
    showCareerFilter: true,
    showMonthFilter: true,
    emptyMessage: "No hay titulados con experiencia laboral registrada para los filtros seleccionados.",
  },
};

export const HEATMAP_VIEW_LIST: HeatmapViewConfig[] = Object.values(HEATMAP_VIEW_CONFIGS);
