"use client";

import { useQuery } from "@tanstack/react-query";
import { toBoliviaTime } from "@/shared/utils/date-time";
import { AVAILABILITY_QUERY_KEYS } from "../constants/availability-query-keys.constants";
import { BLOCKED_DATE_TEXT } from "../constants/blocked-date.constants";
import { availabilityApi } from "../services/availability.service";

export function useFutureBlockedDates() {
  const today = toBoliviaTime(new Date()).date;
  const query = useQuery({
    queryKey: AVAILABILITY_QUERY_KEYS.futureBlockedDates(today),
    queryFn: () => availabilityApi.getFutureBlockedDates(`${today}T00:00:00-04:00`),
  });

  return {
    blockedDates: query.data ?? [],
    isLoading: query.isPending,
    error: query.isError ? BLOCKED_DATE_TEXT.loadError : null,
    refetch: query.refetch,
  };
}
