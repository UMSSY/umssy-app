import type { AvailabilityBlock } from "./availability-block.types";
import type { BlockAppointment } from "./block-appointment.types";

export interface BlockAppointmentDetailProps {
  block: AvailabilityBlock;
  appointment: BlockAppointment;
}
