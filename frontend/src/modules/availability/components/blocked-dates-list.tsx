"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BLOCKED_DATE_TEXT } from "../constants/blocked-date.constants";
import { useFutureBlockedDates } from "../hooks/use-future-blocked-dates";
import { useUnblockDate } from "../hooks/use-unblock-date";
import { formatLongDate } from "../utils/calendar-date";

export function BlockedDatesList() {
  const titleId = useId();
  const { blockedDates, isLoading, error, refetch } = useFutureBlockedDates();
  const { unblockDate, isUnblocking } = useUnblockDate();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const submitting = useRef(false);

  async function handleUnblock(id: string) {
    if (submitting.current) return;
    submitting.current = true;
    setPendingId(id);
    try {
      await unblockDate(id);
    } finally {
      submitting.current = false;
      setPendingId(null);
    }
  }

  return (
    <section aria-labelledby={titleId} className="space-y-4 rounded-lg border border-border bg-surface p-4">
      <header className="space-y-1">
        <h2 id={titleId} className="text-lg font-semibold">{BLOCKED_DATE_TEXT.listTitle}</h2>
        <p className="text-sm text-muted-foreground">{BLOCKED_DATE_TEXT.listHint}</p>
      </header>
      {isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">{BLOCKED_DATE_TEXT.loadingList}</p>
      ) : error ? (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-destructive">{error}</p>
          <Button type="button" variant="outline" onClick={() => void refetch()}>{BLOCKED_DATE_TEXT.retry}</Button>
        </div>
      ) : blockedDates.length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">{BLOCKED_DATE_TEXT.emptyList}</p>
      ) : (
        <ul className="space-y-3" aria-live="polite" aria-busy={isUnblocking}>
          {blockedDates.map((date) => (
            <li key={date.id} className="space-y-2 border-b border-border pb-3 last:border-0 last:pb-0">
              <p className="text-sm font-medium"><time dateTime={date.blockedOn}>{formatLongDate(date.blockedOn)}</time></p>
              {date.reason && <p className="text-sm wrap-anywhere text-muted-foreground">{date.reason}</p>}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUnblocking || pendingId !== null}
                aria-label={`${BLOCKED_DATE_TEXT.unblockTitle}: ${formatLongDate(date.blockedOn)}`}
                onClick={() => void handleUnblock(date.id)}
              >
                {pendingId === date.id ? BLOCKED_DATE_TEXT.unblocking : BLOCKED_DATE_TEXT.unblockTitle}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
