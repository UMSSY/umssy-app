"use client";

import { useEffect, useState } from "react";
import type { CredentialLimit, CredentialOperation } from "../types/credential-limit.types";
import type { ActiveCredentialRestriction, CredentialRestriction } from "../types/credential-restriction.types";

function restrictionKey(email: string, operation: CredentialOperation): string {
  return JSON.stringify([email.trim().toLowerCase(), operation]);
}

export function useCredentialRestrictions() {
  const [restrictions, setRestrictions] = useState<Record<string, CredentialRestriction>>({});
  const [now, setNow] = useState(() => Date.now());
  const hasActiveRestriction = Object.values(restrictions).some((restriction) => restriction.retryAt > now);

  useEffect(() => {
    if (!hasActiveRestriction) return;
    const refreshClock = () => setNow(Date.now());
    const interval = window.setInterval(refreshClock, 1000);
    window.addEventListener("focus", refreshClock);
    document.addEventListener("visibilitychange", refreshClock);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshClock);
      document.removeEventListener("visibilitychange", refreshClock);
    };
  }, [hasActiveRestriction]);

  function restrict(email: string, limit: CredentialLimit | null | undefined, message: string): boolean {
    if (!limit) return false;
    const receivedAt = Date.now();
    setNow(receivedAt);
    setRestrictions((previous) => {
      const active = Object.fromEntries(Object.entries(previous).filter(([, restriction]) => restriction.retryAt > receivedAt));
      const key = restrictionKey(email, limit.operation);
      if (!active[key] || active[key].retryAt < limit.retryAt) {
        active[key] = { ...limit, message };
      }
      return active;
    });
    return true;
  }

  function getRestriction(operation: CredentialOperation, email: string): ActiveCredentialRestriction | null {
    const restriction = restrictions[restrictionKey(email, operation)];
    if (!restriction || restriction.retryAt <= now) return null;
    return { ...restriction, remainingSeconds: Math.ceil((restriction.retryAt - now) / 1000) };
  }

  function isBlocked(operation: CredentialOperation, email: string): boolean {
    const restriction = restrictions[restrictionKey(email, operation)];
    return Boolean(restriction && restriction.retryAt > Date.now());
  }

  return { restrict, getRestriction, isBlocked };
}
