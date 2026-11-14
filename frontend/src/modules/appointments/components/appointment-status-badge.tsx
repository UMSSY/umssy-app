import { Badge } from "@/components/ui/badge";
import { cn } from "cn";
import {
  APPOINTMENT_STATUS_CLASSES,
  APPOINTMENT_STATUS_LABELS,
} from "../constants/appointments.constants";
import type { AppointmentStatusBadgeProps } from "../types/appointment-status-badge-props.types";

export function AppointmentStatusBadge({ status, className }: AppointmentStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("h-6 px-2.5 text-sm", APPOINTMENT_STATUS_CLASSES[status], className)}
    >
      {APPOINTMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
