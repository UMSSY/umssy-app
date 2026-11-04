import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BOLIVIA_TIME_LABEL } from "@/shared/constants/date-time.constants";
import {
  formatBlockRange,
  formatBoliviaDay,
  formatBoliviaMonthShort,
  formatBoliviaWeekdayShort,
} from "@/shared/utils/date-time";
import {
  APPOINTMENTS_TEXT,
  APPOINTMENT_ROLE_LABELS,
  APPOINTMENT_STATUS_CLASSES,
  APPOINTMENT_STATUS_LABELS,
} from "../constants/appointments.constants";
import type { AppointmentCardProps } from "../types/appointment-card-props.types";

export function AppointmentCard({ appointment, onSelect }: AppointmentCardProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onSelect?.(appointment)}
      className="flex h-auto w-full items-stretch justify-start gap-3 rounded-lg border border-border bg-card p-3 text-left font-normal whitespace-normal transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring sm:gap-4 sm:p-4"
    >
      <time
        dateTime={appointment.startAt}
        className="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg bg-accent px-2 py-1.5 text-accent-foreground"
      >
        <span className="text-xs font-semibold tracking-wide">
          {formatBoliviaWeekdayShort(appointment.startAt)}
        </span>
        <span className="text-2xl leading-tight font-bold">
          {formatBoliviaDay(appointment.startAt)}
        </span>
        <span className="text-xs font-semibold tracking-wide">
          {formatBoliviaMonthShort(appointment.startAt)}
        </span>
      </time>

      <span className="grid min-w-0 flex-1 grid-cols-1 items-center gap-y-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-3">
        <span className="col-start-1 row-start-1 min-w-0 font-heading text-base leading-snug font-bold wrap-anywhere text-ink">
          {appointment.counterpart.fullName}
        </span>

        <Badge
          variant="outline"
          className={`col-start-1 row-start-2 h-6 w-fit justify-self-start px-2.5 text-sm sm:col-start-2 sm:row-span-3 sm:row-start-1 sm:justify-self-end ${APPOINTMENT_STATUS_CLASSES[appointment.status]}`}
        >
          {APPOINTMENT_STATUS_LABELS[appointment.status]}
        </Badge>

        <span className="col-start-1 row-start-3 text-sm wrap-anywhere text-text-secondary sm:row-start-2">
          {APPOINTMENT_ROLE_LABELS[appointment.counterpart.role]}
          {" · "}
          {appointment.orientationType?.name ?? APPOINTMENTS_TEXT.noTopic}
        </span>

        <span className="col-start-1 row-start-4 text-sm whitespace-nowrap text-text-secondary sm:row-start-3">
          {formatBlockRange(appointment.startAt, appointment.endAt)}
          {` · ${BOLIVIA_TIME_LABEL}`}
        </span>
      </span>
    </Button>
  );
}
