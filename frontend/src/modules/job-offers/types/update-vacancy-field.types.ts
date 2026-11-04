import type { VacancyConditions } from "./vacancy-conditions.types";

export type UpdateVacancyField = <Field extends keyof VacancyConditions>(
  field: Field,
  value: VacancyConditions[Field],
) => void;
