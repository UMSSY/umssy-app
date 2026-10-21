"use client";

import { useQuery } from "@tanstack/react-query";
import { APPOINTMENTS_QUERY_KEYS } from "../constants/appointments-query-keys.constants";
import { APPOINTMENTS_TEXT } from "../constants/appointments.constants";
import { appointmentsApi } from "../services/appointments.api";

export function useAppointments() {
  const query = useQuery({
    queryKey: APPOINTMENTS_QUERY_KEYS.mine(),
    queryFn: () => appointmentsApi.getMyAppointments(),
  });

  return {
    appointments: query.data ?? [],
    isLoading: query.isPending,
    error: query.isError ? APPOINTMENTS_TEXT.loadError : null,
  };
}
