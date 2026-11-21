"use client";

import { useCallback, useMemo, useState } from "react";
import type { MentorProfileDraftValue } from "../types/mentor-profile-draft-value.types";

export function useMentorProfileDraftState(): MentorProfileDraftValue {
  const [technicalAreaIds, setTechnicalAreaIds] = useState<string[] | null>(null);
  const [orientationTypeIds, setOrientationTypeIds] = useState<string[] | null>(null);

  const clearTechnicalAreaIds = useCallback(() => setTechnicalAreaIds(null), []);
  const clearOrientationTypeIds = useCallback(() => setOrientationTypeIds(null), []);
  const clearAllDrafts = useCallback(() => {
    setTechnicalAreaIds(null);
    setOrientationTypeIds(null);
  }, []);

  return useMemo(
    () => ({
      technicalAreaIds,
      orientationTypeIds,
      setTechnicalAreaIds,
      setOrientationTypeIds,
      clearTechnicalAreaIds,
      clearOrientationTypeIds,
      clearAllDrafts,
    }),
    [technicalAreaIds, orientationTypeIds, clearTechnicalAreaIds, clearOrientationTypeIds, clearAllDrafts],
  );
}