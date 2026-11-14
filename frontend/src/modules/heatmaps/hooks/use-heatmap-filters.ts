"use client";

import { useState } from "react";
import type { HeatmapFilters, HeatmapSemesterRange } from "../types/heatmap-filters.types";

export function useHeatmapFilters() {
  const [filters, setFilters] = useState<HeatmapFilters>({});

  return {
    filters,
    setCareer: (careerId?: string) => setFilters((current) => ({ ...current, careerId })),
    setYear: (year?: string) => setFilters((current) => ({ ...current, year })),
    setMonth: (month?: string) => setFilters((current) => ({ ...current, month })),
    setSemesterRange: (semesterRange?: HeatmapSemesterRange) => setFilters((current) => ({ ...current, semesterRange, year: semesterRange ? undefined : current.year })),
  };
}
