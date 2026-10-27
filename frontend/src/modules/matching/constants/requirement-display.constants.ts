import type { RequirementStatus } from "../types/job-matching.types";
import type { RequirementCategory } from "../types/requirement-category.types";

export const REQUIREMENT_STATUS_LABELS: Record<RequirementStatus, string> = {
  Cumple: "Coincide",
  Pendiente: "Falta",
};

export const REQUIREMENT_GROUP_LABELS: Record<RequirementCategory, string> = {
  skill: "Habilidades",
  academic: "Académicos y experiencia",
  other: "Otros requisitos",
};

export const REQUIREMENT_GROUP_ORDER: readonly RequirementCategory[] = [
  "skill",
  "academic",
  "other",
];
