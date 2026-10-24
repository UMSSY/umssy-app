"use client";

import { WorkspacePage } from "@/shared/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { APPOINTMENTS_EYEBROW, APPOINTMENTS_TEXT } from "../constants/appointments.constants";
import { useAppointments } from "../hooks/use-appointments";

export function AppointmentsView() {
  const { appointments, isLoading, error } = useAppointments();

  return (
    <WorkspacePage title={APPOINTMENTS_TEXT.title} description={APPOINTMENTS_EYEBROW}>
      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-lg" />
      ) : error ? (
        <p className="text-center text-destructive">{error}</p>
      ) : appointments.length === 0 ? (
        <p
          role="status"
          className="rounded-lg border border-dashed border-border px-4 py-3 text-center text-sm text-muted-foreground"
        >
          {APPOINTMENTS_TEXT.emptyState}
        </p>
      ) : (
        <ul className="space-y-2">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="rounded-lg border border-border p-3 text-sm">
              {appointment.counterpart.fullName} · {appointment.startAt} – {appointment.endAt}
            </li>
          ))}
        </ul>
      )}
    </WorkspacePage>
  );
}
