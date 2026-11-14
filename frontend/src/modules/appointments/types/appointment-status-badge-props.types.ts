import type { AppointmentStatus } from "./appointment-status.types";

export interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
}
