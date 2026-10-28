import type { VacancyConditions } from "./vacancy-conditions.types";
import type { VacancyErrors } from "./vacancy-errors.types";
import type { UpdateVacancyField } from "./update-vacancy-field.types";
import type { Modality } from "./modality.types";

export interface InformationStepProps {
  conditions: VacancyConditions;
  errors: VacancyErrors;
  updateField: UpdateVacancyField;
  selectModality: (modality: Modality) => void;
  validateField: (field: keyof VacancyConditions) => void;
  onCancel: () => void;
  onContinue: () => void;
}
