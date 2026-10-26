"use client";

import { useEffect, useState } from "react";
import { secondsUntil } from "../utils/format-countdown";

// Cuenta regresiva en segundos hacia un instante ISO; offsetMs = hora del servidor - hora del navegador
export function useCountdown(targetIso: string | null, offsetMs: number): number {
  const [remaining, setRemaining] = useState(() => secondsUntil(targetIso, offsetMs));

  useEffect(() => {
    const tick = () => setRemaining(secondsUntil(targetIso, offsetMs));
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [targetIso, offsetMs]);

  return remaining;
}
