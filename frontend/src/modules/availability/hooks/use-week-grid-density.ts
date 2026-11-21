"use client";

import { useEffect, useState } from "react";
import { readLocalStorage, writeLocalStorage } from "@/shared/services/storage/browser-local-storage";
import { WEEK_GRID_DENSITY_STORAGE_KEY } from "../constants/week-grid.constants";
import type { WeekGridDensity } from "../types/week-grid-density.types";
import { isWeekGridDensity } from "../utils/week-grid.utils";

export function useWeekGridDensity() {
  const [density, setDensityState] = useState<WeekGridDensity>("normal");

  useEffect(() => {
    const stored = readLocalStorage(WEEK_GRID_DENSITY_STORAGE_KEY);
    if (isWeekGridDensity(stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDensityState(stored);
    }
  }, []);

  function setDensity(next: WeekGridDensity) {
    setDensityState(next);
    writeLocalStorage(WEEK_GRID_DENSITY_STORAGE_KEY, next);
  }

  return { density, setDensity };
}
