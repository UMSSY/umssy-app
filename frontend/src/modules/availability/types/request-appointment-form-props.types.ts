import type { OrientationTypeResponse } from "@/modules/mentorship";
import type { AppointmentRequestValues } from "./appointment-request-values.types";

export interface RequestAppointmentFormProps {
  orientationTypes: OrientationTypeResponse[];
  isLoadingTopics: boolean;
  isSubmitting: boolean;
  onSubmit: (values: AppointmentRequestValues) => void;
  onDirtyChange: (isDirty: boolean) => void;
}
