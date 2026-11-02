import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BOLIVIA_TIME_LABEL } from "@/shared/constants/date-time.constants";
import { formatBlockRange } from "@/shared/utils/date-time";
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENTS_TEXT,
} from "../constants/appointments.constants";
import type { AppointmentCardProps } from "../types/appointment-card-props.types";

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const dateLabel = new Intl.DateTimeFormat("es-BO", {
    dateStyle: "long",
    timeZone: "America/La_Paz",
  }).format(new Date(appointment.startAt));

  return (
    <Card className="min-w-0">
      <CardHeader className="min-w-0">
        <CardTitle className="min-w-0 wrap-anywhere">
          {appointment.counterpart.role === "mentor" ? (
            <Link
              href={`/mentors/${appointment.counterpart.id}`}
              className="rounded-sm text-primary hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {appointment.counterpart.fullName}
            </Link>
          ) : (
            appointment.counterpart.fullName
          )}
        </CardTitle>
        <Badge variant="outline">
          {APPOINTMENT_STATUS_LABELS[appointment.status]}
        </Badge>
      </CardHeader>

      <CardContent className="min-w-0 space-y-2 text-sm">
        <p>
          <time dateTime={appointment.startAt}>{dateLabel}</time>
        </p>
        <p>{formatBlockRange(appointment.startAt, appointment.endAt)}</p>
        <p className="text-muted-foreground">{BOLIVIA_TIME_LABEL}</p>
        <p className="wrap-anywhere">
          {`${APPOINTMENTS_TEXT.topicLabel} ${appointment.orientationType?.name ?? APPOINTMENTS_TEXT.noTopic}`}
        </p>
      </CardContent>
    </Card>
  );
}
