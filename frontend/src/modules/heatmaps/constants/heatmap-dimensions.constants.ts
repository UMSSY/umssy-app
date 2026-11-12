import type { HeatmapExtraColumnConfig } from "../types/heatmap.types";
import type { HeatmapCareerId, HeatmapEmploymentStatus } from "../types/heatmap-graduate-record.types";

export const HEATMAP_SKILLS = [
  { id: "sql", name: "SQL y bases de datos" },
  { id: "javascript", name: "JavaScript / TypeScript" },
  { id: "python", name: "Python" },
  { id: "java", name: "Java" },
  { id: "react", name: "React" },
  { id: "nodejs", name: "Node.js" },
  { id: "docker", name: "Docker" },
  { id: "cloud", name: "Cloud (AWS / Azure)" },
  { id: "git", name: "Git y control de versiones" },
  { id: "machine-learning", name: "Machine Learning" },
] as const;

export const HEATMAP_CAREERS: { id: HeatmapCareerId; label: string }[] = [
  { id: "systems", label: "Ing. de Sistemas" },
  { id: "informatics", label: "Ing. Informática" },
];

export const HEATMAP_SALARY_RANGES = [
  { id: "up-to-3000", label: "Hasta Bs 3.000", min: 0, max: 3000 },
  { id: "3000-5000", label: "Más de Bs 3.000 y hasta Bs 5.000", min: 3000, max: 5000 },
  { id: "5000-8000", label: "Más de Bs 5.000 y hasta Bs 8.000", min: 5000, max: 8000 },
  { id: "8000-12000", label: "Más de Bs 8.000 y hasta Bs 12.000", min: 8000, max: 12000 },
  { id: "over-12000", label: "Más de Bs 12.000", min: 12000, max: Number.POSITIVE_INFINITY },
] as const;

export const HEATMAP_EMPLOYMENT_STATUSES: { id: HeatmapEmploymentStatus; label: string; retains: boolean }[] = [
  { id: "employed-in-field", label: "Empleado en su área", retains: true },
  { id: "employed-other-field", label: "Empleado en otra área", retains: true },
  { id: "self-employed", label: "Independiente", retains: true },
  { id: "job-seeking", label: "Buscando empleo", retains: false },
];

export const HEATMAP_EXPERIENCE_LEVELS = [
  { id: "junior", label: "Junior", range: "hasta 2 años", minExclusive: Number.NEGATIVE_INFINITY, max: 2 },
  { id: "semi-senior", label: "Semi-Senior", range: "2 a 5 años", minExclusive: 2, max: 5 },
  { id: "senior", label: "Senior", range: "más de 5 años", minExclusive: 5, max: Number.POSITIVE_INFINITY },
] as const;

export const HEATMAP_EXTRA_COLUMNS = {
  totalGraduates: { id: "total_graduates", label: "Total titulados", sublabel: "con la habilidad", format: "count" },
  jobRetention: { id: "job_retention", label: "Retención laboral", sublabel: "empleados o independientes", format: "percentage" },
  totalMastering: { id: "total_mastering", label: "Total que la dominan", format: "count" },
  highestAdoption: { id: "highest_adoption", label: "Mayor adopción en", sublabel: "nivel con más %", format: "badge" },
} satisfies Record<string, HeatmapExtraColumnConfig>;
