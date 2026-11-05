"use client";

import { useQuery } from "@tanstack/react-query";
import { APPOINTMENTS_QUERY_KEYS } from "../constants/appointments-query-keys.constants";
import { APPOINTMENT_DETAIL_TEXT } from "../constants/appointments.constants";
import { appointmentsApi } from "../services/appointments.service";

export function useAppointment(appointmentId: string | null) {
  const query = useQuery({
    queryKey: APPOINTMENTS_QUERY_KEYS.detail(appointmentId ?? ""),
    queryFn: () => appointmentsApi.getById(appointmentId ?? ""),
    enabled: appointmentId !== null,
  });

  return {
    appointment: query.data ?? null,
    isLoading: query.isPending && appointmentId !== null,
    error: query.isError ? APPOINTMENT_DETAIL_TEXT.loadError : null,
  };
}
