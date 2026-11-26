import type { PresentationValues } from "./presentation-values.types";
import type { PresentationErrors } from "./presentation-errors.types";

export interface PresentationFormProps {
  idPrefix?: string;
  saveLabel?: string;
  initialValues: PresentationValues;
  isSaving?: boolean;
  guardProfileReview?: boolean;
  serverErrors?: PresentationErrors;
  onEdit?: (field?: keyof PresentationValues) => void;
  onSubmit: (values: PresentationValues) => void | Promise<boolean>;
}
