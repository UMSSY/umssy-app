"use client";

import { useEffect, useState } from "react";

export function useOfferCountdown(expiresAt: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  const refresh = () => setNow(Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => setNow(Date.now());
    const interval = setInterval(update, 1000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => { clearInterval(interval); window.removeEventListener("focus", update); document.removeEventListener("visibilitychange", update); };
  }, [expiresAt]);
  const deadline = expiresAt ? Date.parse(expiresAt) : 0;
  const remaining = Number.isFinite(deadline) ? Math.max(0, deadline - now) : 0;
  const seconds = Math.ceil(remaining / 1000);
  return {
    expired: remaining === 0,
    label: `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m ${seconds % 60}s restantes`,
    refresh,
  };
}
