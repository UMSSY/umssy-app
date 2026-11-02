import type { AppointmentRequestValues } from "./appointment-request-values.types";
import type { AvailabilityBlock } from "./availability-block.types";

export interface CreateAppointmentVariables {
  block: AvailabilityBlock;
  values: AppointmentRequestValues;
}
