import type { PresentationValues } from "./presentation-values.types";
import type { PresentationErrors } from "./presentation-errors.types";

export interface PresentationFormProps {
  initialValues: PresentationValues;
  isSaving?: boolean;
  serverErrors?: PresentationErrors;
  onEdit?: (field?: keyof PresentationValues) => void;
  onSubmit: (values: PresentationValues) => void;
}
