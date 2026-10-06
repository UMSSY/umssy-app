"use client";

import { useEffect, useState } from "react";
import { getWeekRange } from "@/shared/utils/date-time";
import { MY_AVAILABILITY_TEXT } from "../constants/my-availability.constants";
import { availabilityApi } from "../services/availability.api";
import type { AvailabilityBlock } from "../types/availability-block.types";

// TODO: migrar a useQuery con la semana en la key (#777)
export function useMyBlocks(weekStart: string) {
  const [reloadCount, setReloadCount] = useState(0);
  const [currentWeekStart, setCurrentWeekStart] = useState(weekStart);
  const [currentReloadCount, setCurrentReloadCount] = useState(reloadCount);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (currentWeekStart !== weekStart || currentReloadCount !== reloadCount) {
    if (currentWeekStart !== weekStart) setBlocks([]);
    setCurrentWeekStart(weekStart);
    setCurrentReloadCount(reloadCount);
    setIsLoading(true);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    const { startAt, endAt } = getWeekRange(weekStart);
    availabilityApi
      .getAvailabilityBlocks({ from: startAt, to: endAt })
      .then((data) => {
        if (!cancelled) setBlocks(data);
      })
      .catch(() => {
        if (!cancelled) setError(MY_AVAILABILITY_TEXT.loadError);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [weekStart, reloadCount]);

  const refetch = () => setReloadCount((count) => count + 1);

  return { blocks, isLoading, error, refetch };
}
