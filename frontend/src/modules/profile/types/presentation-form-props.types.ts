import type { PresentationValues } from "./presentation-values.types";
import type { PresentationErrors } from "./presentation-errors.types";

export interface PresentationFormProps {
  idPrefix?: string;
  saveLabel?: string;
  initialValues: PresentationValues;
  isSaving?: boolean;
  serverErrors?: PresentationErrors;
  onEdit?: (field?: keyof PresentationValues) => void;
  onSubmit: (values: PresentationValues) => void;
}
