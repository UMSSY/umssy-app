"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { APPOINTMENTS_QUERY_KEYS } from "../constants/appointments-query-keys.constants";
import { appointmentsApi } from "../services/appointments.service";

export function useCounterpartPhoto(appointmentId: string | null) {
  const query = useQuery({
    queryKey: APPOINTMENTS_QUERY_KEYS.counterpartPhoto(appointmentId ?? ""),
    queryFn: () => appointmentsApi.getCounterpartPhoto(appointmentId ?? ""),
    enabled: appointmentId !== null,
    retry: false,
  });
  const photo = query.data ?? null;
  const photoUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);

  useEffect(
    () => () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    },
    [photoUrl],
  );

  return photoUrl;
}
