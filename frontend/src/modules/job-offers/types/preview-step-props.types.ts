import type { VacancyConditions } from "./vacancy-conditions.types";
import type { CurrentCompany } from "./current-company.types";
import type { PublishError } from "./publish-error.types";

export interface PreviewStepProps {
  conditions: VacancyConditions;
  company: CurrentCompany;
  isSubmitting: boolean;
  error: PublishError | null;
  isEditMode?: boolean;
  onPrevious: () => void;
  onConfirm: () => void;
}
