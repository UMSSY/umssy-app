import type { VacancyConditions } from "./vacancy-conditions.types";
import type { VacancyErrors } from "./vacancy-errors.types";
import type { UpdateVacancyField } from "./update-vacancy-field.types";

export interface RequirementsStepProps {
  conditions: VacancyConditions;
  errors: VacancyErrors;
  updateField: UpdateVacancyField;
  onPrevious: () => void;
  onContinue: () => void;
}
