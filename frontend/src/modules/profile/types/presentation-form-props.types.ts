import type { PresentationValues } from "./presentation-values.types";

export interface PresentationFormProps {
  initialValues: PresentationValues;
  fullName: string;
  isSaving?: boolean;
  onSubmit: (values: PresentationValues) => void;
}
