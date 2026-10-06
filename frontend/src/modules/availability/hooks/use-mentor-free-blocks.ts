"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FREE_BLOCKS_STALE_TIME_MS,
  MENTOR_FREE_BLOCKS_TEXT,
} from "../constants/mentor-free-blocks.constants";
import { availabilityApi } from "../services/availability.api";
import type { AvailabilityBlock } from "../types/availability-block.types";
import type { CacheEntry } from "../types/availability-cache.types";
import type { WeekRange } from "@/shared/types/week-range.types";

export function useMentorFreeBlocks(mentorId: string, weekRange: WeekRange) {
  const { startAt, endAt } = weekRange;
  const range = useMemo(() => ({ startAt, endAt }), [startAt, endAt]);
  const requestKey = `${mentorId}|${startAt}|${endAt}`;

  const cacheRef = useRef(new Map<string, CacheEntry>());
  const forceRefreshRef = useRef(false);

  const [currentRequestKey, setCurrentRequestKey] = useState(requestKey);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  if (currentRequestKey !== requestKey) {
    setCurrentRequestKey(requestKey);
    setBlocks([]);
    setIsLoading(true);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    const forceRefresh = forceRefreshRef.current;
    forceRefreshRef.current = false;

    const cached = cacheRef.current.get(requestKey);
    const isFresh = cached && Date.now() - cached.fetchedAt < FREE_BLOCKS_STALE_TIME_MS;

    if (!forceRefresh && isFresh) {
      setBlocks(cached.blocks);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    availabilityApi
      .getMentorFreeBlocks(mentorId, range)
      .then((data) => {
        if (!cancelled) {
          cacheRef.current.set(requestKey, { blocks: data, fetchedAt: Date.now() });
          setBlocks(data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError(MENTOR_FREE_BLOCKS_TEXT.loadError);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mentorId, range, requestKey, reloadCount]);

  useEffect(() => {
    function handleFocusRegain() {
      if (document.visibilityState !== "hidden") {
        forceRefreshRef.current = true;
        setReloadCount((count) => count + 1);
      }
    }

    window.addEventListener("focus", handleFocusRegain);
    document.addEventListener("visibilitychange", handleFocusRegain);

    return () => {
      window.removeEventListener("focus", handleFocusRegain);
      document.removeEventListener("visibilitychange", handleFocusRegain);
    };
  }, []);

  return { blocks, isLoading, error };
}