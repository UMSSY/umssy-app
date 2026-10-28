import type { VacancyConditions } from "./vacancy-conditions.types";

export type VacancyErrors = Partial<Record<keyof VacancyConditions, string>>;
