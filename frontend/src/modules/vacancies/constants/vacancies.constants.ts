import type { RoleTag } from "@/modules/auth";

export const PUBLISHED_JOB_OFFERS_ENDPOINT = "/job-offers";

export const VACANCY_QUERY_KEYS = {
  published: ["vacancies", "published"] as const,
};

export const VACANCY_APPLICANT_ROLES: readonly RoleTag[] = ["titulado", "estudiante"];
