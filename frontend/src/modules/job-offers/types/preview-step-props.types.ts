import type { VacancyConditions } from "./vacancy-conditions.types";
import type { CurrentCompany } from "./current-company.types";
import type { PublishError } from "./publish-error.types";
import type { ExpirationDate } from "../hooks/use-expiration-date";

export interface PreviewStepProps {
  conditions: VacancyConditions;
  company: CurrentCompany;
  isSubmitting: boolean;
  error: PublishError | null;
  isEditMode?: boolean;
  expiration?: ExpirationDate;
  onPrevious: () => void;
  onConfirm: () => void;
}
