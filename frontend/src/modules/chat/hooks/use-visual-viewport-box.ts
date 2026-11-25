"use client";

import { useSyncExternalStore } from "react";
import type { VisualViewportBox } from "../types/visual-viewport-box.types";

const KEYBOARD_MIN_HEIGHT = 150;
const baseline = { width: 0, height: Number.POSITIVE_INFINITY };

function subscribe(onChange: () => void) {
  const viewport = window.visualViewport;
  window.addEventListener("resize", onChange);
  viewport?.addEventListener("resize", onChange);
  viewport?.addEventListener("scroll", onChange);
  return () => {
    window.removeEventListener("resize", onChange);
    viewport?.removeEventListener("resize", onChange);
    viewport?.removeEventListener("scroll", onChange);
  };
}

function getSnapshot() {
  const viewport = window.visualViewport;
  if (!viewport) return null;
  const layoutHeight = window.innerHeight;
  const isKeyboardOpen = layoutHeight - viewport.height > KEYBOARD_MIN_HEIGHT;
  if (window.innerWidth !== baseline.width) {
    baseline.width = window.innerWidth;
    baseline.height = layoutHeight;
  } else if (!isKeyboardOpen) {
    baseline.height = Math.min(baseline.height, layoutHeight);
  }
  const hiddenToolbarExtra = isKeyboardOpen ? Math.max(0, layoutHeight - baseline.height) : 0;
  return `${viewport.height - hiddenToolbarExtra}:${viewport.offsetTop}`;
}

function getServerSnapshot() {
  return null;
}

export function useVisualViewportBox(): VisualViewportBox | null {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!snapshot) return null;
  const [height, offsetTop] = snapshot.split(":").map(Number);
  return { height, offsetTop };
}
