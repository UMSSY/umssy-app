"use client";

import { useAppVisibilityReport } from "../hooks/use-app-visibility-report";

export function AppVisibilityReporter() {
  useAppVisibilityReport();
  return null;
}
