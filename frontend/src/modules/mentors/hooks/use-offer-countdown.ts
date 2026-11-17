"use client";

import { useEffect, useState } from "react";

export function useOfferCountdown(expiresAt: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, []);
  const remaining =
    now === null ? null : Math.max(0, new Date(expiresAt).getTime() - now);
  const expired =
    remaining !== null && (!Number.isFinite(remaining) || remaining <= 0);
  const hours = Math.floor((remaining ?? 0) / 3600000);
  const minutes = Math.floor(((remaining ?? 0) % 3600000) / 60000);
  const seconds = Math.floor(((remaining ?? 0) % 60000) / 1000);
  return {
    expired,
    label:
      remaining === null
        ? "Calculando tiempo restante…"
        : expired
          ? "El plazo ha vencido"
          : `${hours}h ${minutes}m ${seconds}s restantes`,
  };
}
