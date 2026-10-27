"use client";

import { useEffect, useState } from "react";

export function useOfferCountdown(expiresAt: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 1000);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, []);
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
  const expired = !Number.isFinite(remaining) || remaining <= 0;
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return { expired, label: expired ? "El plazo ha vencido" : `${hours}h ${minutes}m ${seconds}s restantes` };
}
