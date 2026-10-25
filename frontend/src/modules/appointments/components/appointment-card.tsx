import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatBlockRange } from "@/shared/utils/date-time";
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENTS_TEXT,
} from "../constants/appointments.constants";
import type { Appointment } from "../types/appointment.types";

export function AppointmentCard({
  appointment,
}: {
  appointment: Appointment;
}) {
  const dateLabel = new Intl.DateTimeFormat("es-BO", {
    dateStyle: "long",
    timeZone: "America/La_Paz",
  }).format(new Date(appointment.startAt));

  return (
    <Card className="min-w-0">
      <CardHeader className="min-w-0">
        <CardTitle className="min-w-0 wrap-anywhere">
          {appointment.counterpart.fullName}
        </CardTitle>
        <Badge variant="outline">
          {APPOINTMENT_STATUS_LABELS[appointment.status]}
        </Badge>
      </CardHeader>

      <CardContent className="min-w-0 space-y-2 text-sm">
        <p>
          <time dateTime={appointment.startAt}>{dateLabel}</time>
        </p>
        <p>
          {formatBlockRange(appointment.startAt, appointment.endAt)}
        </p>
        <p className="text-muted-foreground">
          {APPOINTMENTS_TEXT.timezone}
        </p>
        <p className="wrap-anywhere">
          Tema: {appointment.orientationType?.name ?? APPOINTMENTS_TEXT.noTopic}
        </p>
      </CardContent>
    </Card>
  );
}
