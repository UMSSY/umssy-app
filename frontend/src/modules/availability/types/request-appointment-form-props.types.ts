import type { OrientationTypeResponse } from "@/modules/mentorship";
import type { AppointmentRequestValues } from "./appointment-request-values.types";

export interface RequestAppointmentFormProps {
  selectedAreaName?: string;
  selectedArea?: string;
  orientationTypes: OrientationTypeResponse[];
  isLoadingTopics: boolean;
  isSubmitting: boolean;
  canRetry?: boolean;
  onSubmit: (values: AppointmentRequestValues) => void;
  onDirtyChange: (isDirty: boolean) => void;
}
