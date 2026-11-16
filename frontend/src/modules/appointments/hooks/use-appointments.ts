"use client";

import { useQuery } from "@tanstack/react-query";
import { DEFAULT_APPOINTMENTS_PAGE } from "../constants/appointments-pagination.constants";
import { APPOINTMENTS_QUERY_KEYS } from "../constants/appointments-query-keys.constants";
import { APPOINTMENTS_TEXT } from "../constants/appointments.constants";
import { appointmentsApi } from "../services/appointments.service";
import type { AppointmentScope } from "../types/appointment-scope.types";

export function useAppointments(
  scope: AppointmentScope = "upcoming",
  page: number = DEFAULT_APPOINTMENTS_PAGE,
) {
  const query = useQuery({
    queryKey: APPOINTMENTS_QUERY_KEYS.mine(scope, page),
    queryFn: () => appointmentsApi.getMyAppointments({ scope, page }),
  });

  return {
    appointments: query.data?.items ?? [],
    page: query.data?.page ?? page,
    total: query.data?.total ?? 0,
    pageSize: query.data?.pageSize ?? 0,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    error: query.isError ? APPOINTMENTS_TEXT.loadError : null,
  };
}
