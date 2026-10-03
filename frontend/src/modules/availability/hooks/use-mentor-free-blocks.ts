"use client";

import { useEffect, useState } from "react";
import { availabilityApi } from "../services/availability.api";
import type { AvailabilityBlock } from "../types/availability";

export function useMentorFreeBlocks(mentorId: string) {
  const [currentMentorId, setCurrentMentorId] = useState(mentorId);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (currentMentorId !== mentorId) {
    setCurrentMentorId(mentorId);
    setIsLoading(true);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    availabilityApi
      .getMentorFreeBlocks(mentorId)
      .then((data) => {
        if (!cancelled) setBlocks(data);
      })
      .catch(() => {
        if (!cancelled) setError("Error al obtener los bloques de disponibilidad");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mentorId]);

  return { blocks, isLoading, error };
}
