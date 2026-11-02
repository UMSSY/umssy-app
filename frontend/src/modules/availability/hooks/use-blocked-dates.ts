"use client";

import { useQuery } from "@tanstack/react-query";
import { getWeekRange } from "@/shared/utils/date-time";
import { AVAILABILITY_QUERY_KEYS } from "../constants/availability-query-keys.constants";
import { BLOCKED_DATE_TEXT } from "../constants/blocked-date.constants";
import { availabilityApi } from "../services/availability.service";

export function useBlockedDates(weekStart: string) {
  const query = useQuery({
    queryKey: AVAILABILITY_QUERY_KEYS.blockedDates(weekStart),
    queryFn: () => availabilityApi.getBlockedDates(getWeekRange(weekStart)),
  });

  return {
    blockedDates: query.data ?? [],
    isLoading: query.isPending,
    error: query.isError ? BLOCKED_DATE_TEXT.loadError : null,
  };
}
