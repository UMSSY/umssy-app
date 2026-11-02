"use client";

import { useCallback, useRef } from "react";

export function useReportSnapshot() {
  const snapshotRef = useRef<string | undefined>(undefined);

  const resolveSnapshotAt = useCallback((page: number) => {
    if (page <= 1 || !snapshotRef.current) {
      snapshotRef.current = new Date().toISOString();
      return undefined;
    }
    return snapshotRef.current;
  }, []);

  const renewSnapshot = useCallback(() => {
    snapshotRef.current = undefined;
  }, []);

  return { resolveSnapshotAt, renewSnapshot };
}
