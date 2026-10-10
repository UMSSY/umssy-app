import type {
  AffinityAxis,
  Candidate,
  Vacancy,
} from "../types/matching-types";

/**
 * Los 6 ejes del Radar de Afinidad, en el orden mostrado en el mockup de Figma
 * (HU1 — perfil propio del egresado): Desarrollo, Cloud/DevOps, Data/AI, QA,
 * Ciberseguridad y Gobernanza TI.
 */
export const AFFINITY_AXES: AffinityAxis[] = [
  { id: "desarrollo", label: "Desarrollo" },
  { id: "cloud-devops", label: "Cloud/DevOps" },
  { id: "data-ai", label: "Data/AI" },
  { id: "qa", label: "QA" },
  { id: "ciberseguridad", label: "Ciberseguridad" },
  { id: "gobernanza-ti", label: "Gobernanza TI" },
];

export const AXIS_MAX_SCORE = 10;

/**
 * Pool de candidatos. Los mismos candidatos postulan a las 3 vacantes de ejemplo;
 * lo que cambia por vacante es el % de afinidad y las brechas, calculados en
 * matching.service.ts contra el perfil objetivo de cada vacante.
 *
 * Los puntajes de "Carlos Mendoza Ríos" son los mismos que aparecen en el mockup
 * de HU1 (perfil propio del egresado), para que ambas pantallas sean consistentes
 * cuando se integren.
 */
export const CANDIDATES_POOL: Candidate[] = [
  {
    id: "cand-carlos-mendoza",
    name: "Carlos Mendoza Ríos",
    role: "Senior Software Engineer",
    technologies: ["React", "Node.js", "AWS"],
    scores: {
      desarrollo: 8.5,
      "cloud-devops": 7,
      "data-ai": 6.5,
      qa: 5,
      ciberseguridad: 4.5,
      "gobernanza-ti": 6,
    },
  },
  {
    id: "cand-lucia-flores",
    name: "Lucía Flores Mamani",
    role: "Data Scientist Sr.",
    technologies: ["Python", "TensorFlow", "SQL"],
    scores: {
      desarrollo: 6,
      "cloud-devops": 5,
      "data-ai": 9,
      qa: 6,
      ciberseguridad: 4,
      "gobernanza-ti": 5.5,
    },
  },
  {
    id: "cand-rodrigo-baptista",
    name: "Rodrigo Baptista Vera",
    role: "DevOps Engineer",
    technologies: ["Docker", "CI/CD", "Linux"],
    scores: {
      desarrollo: 6.5,
      "cloud-devops": 9,
      "data-ai": 5,
      qa: 6,
      ciberseguridad: 6.5,
      "gobernanza-ti": 6,
    },
  },
  {
    id: "cand-valentina-cruz",
    name: "Valentina Cruz Pinto",
    role: "Cloud Architect",
    technologies: ["AWS", "Kubernetes", "Terraform"],
    scores: {
      desarrollo: 6,
      "cloud-devops": 8.5,
      "data-ai": 6,
      qa: 5.5,
      ciberseguridad: 7,
      "gobernanza-ti": 7,
    },
  },
  {
    id: "cand-diego-alvarado",
    name: "Diego Alvarado Soto",
    role: "QA Lead",
    technologies: ["Selenium", "Cypress", "Jest"],
    scores: {
      desarrollo: 5,
      "cloud-devops": 4.5,
      "data-ai": 4,
      qa: 8.5,
      ciberseguridad: 5,
      "gobernanza-ti": 5,
    },
  },
  {
    id: "cand-mariana-gutierrez",
    name: "Mariana Gutiérrez Lima",
    role: "Security Engineer",
    technologies: ["OWASP", "Pentesting", "ISO 27001"],
    scores: {
      desarrollo: 5.5,
      "cloud-devops": 6,
      "data-ai": 5,
      qa: 5.5,
      ciberseguridad: 9,
      "gobernanza-ti": 6.5,
    },
  },
];

/** 3 vacantes de ejemplo, cada una con un perfil objetivo distinto por eje. */
export const VACANCIES: Vacancy[] = [
  {
    id: "vac-tech-lead",
    title: "Tech Lead",
    targetProfile: {
      desarrollo: 8,
      "cloud-devops": 6,
      "data-ai": 7,
      qa: 7,
      ciberseguridad: 5,
      "gobernanza-ti": 6.5,
    },
  },
  {
    id: "vac-data-scientist-sr",
    title: "Data Scientist Sr.",
    targetProfile: {
      desarrollo: 5,
      "cloud-devops": 5,
      "data-ai": 9,
      qa: 6,
      ciberseguridad: 4.5,
      "gobernanza-ti": 5,
    },
  },
  {
    id: "vac-devops-engineer",
    title: "DevOps Engineer",
    targetProfile: {
      desarrollo: 5.5,
      "cloud-devops": 8.5,
      "data-ai": 5,
      qa: 6,
      ciberseguridad: 6.5,
      "gobernanza-ti": 6,
    },
  },
];
