"use client";

import { useCallback, useEffect, useRef } from "react";
import { SCROLL_RESTORE_DELAY_MS } from "../constants/audit-log.constants";
import type { ScrollPosition } from "../types/scroll-position.types";
import { captureScrollPositions, restoreScrollPositions } from "../utils/scroll-snapshot";

export function useScrollRestoration<T extends Element>() {
  const anchorRef = useRef<T | null>(null);
  const savedRef = useRef<ScrollPosition[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef<number | null>(null);

  const cancelPending = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    timerRef.current = null;
    frameRef.current = null;
  }, []);

  const save = useCallback(() => {
    savedRef.current = captureScrollPositions(anchorRef.current);
  }, []);

  const restore = useCallback(() => {
    const positions = savedRef.current;
    if (!positions) return;
    savedRef.current = null;
    const apply = () => restoreScrollPositions(positions);
    cancelPending();
    frameRef.current = requestAnimationFrame(apply);
    timerRef.current = setTimeout(apply, SCROLL_RESTORE_DELAY_MS);
  }, [cancelPending]);

  useEffect(() => cancelPending, [cancelPending]);

  return { anchorRef, save, restore };
}
