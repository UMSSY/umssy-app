"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toBoliviaTime } from "@/shared/utils/date-time";
import {
  BLOCKED_DATE_PAST_ERROR,
  BLOCKED_DATE_REASON_ERROR,
  BLOCKED_DATE_REASON_MAX_LENGTH,
  BLOCKED_DATE_TEXT,
} from "../constants/blocked-date.constants";
import { useBlockDate } from "../hooks/use-block-date";
import { useUnblockDate } from "../hooks/use-unblock-date";
import type { BlockedDatePanelProps } from "../types/blocked-date-panel-props.types";
import { formatLongDate } from "../utils/calendar-date";

export function BlockedDatePanel({ date, blockedDate, onClose }: BlockedDatePanelProps) {
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const reasonId = useId();
  const submitting = useRef(false);
  const block = useBlockDate();
  const unblock = useUnblockDate();
  const isBusy = block.isBlocking || unblock.isUnblocking;
  const isPast = date < toBoliviaTime(new Date()).date;
  const reasonTooLong = reason.length > BLOCKED_DATE_REASON_MAX_LENGTH;
  const error = validationError ?? (reasonTooLong ? BLOCKED_DATE_REASON_ERROR : null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || isBusy) return;
    if (!blockedDate) {
      if (date < toBoliviaTime(new Date()).date) {
        setValidationError(BLOCKED_DATE_PAST_ERROR);
        return;
      }
      if (reasonTooLong) {
        setValidationError(BLOCKED_DATE_REASON_ERROR);
        return;
      }
    }
    submitting.current = true;
    try {
      const saved = blockedDate
        ? await unblock.unblockDate(blockedDate.id)
        : await block.blockDate({ blockedOn: date, reason: reason.trim() || null });
      if (saved) onClose();
    } finally {
      submitting.current = false;
    }
  }

  return (
    <aside
      aria-labelledby={`${reasonId}-title`}
      className="space-y-4 rounded-lg border border-border bg-surface p-4"
    >
      <header className="space-y-1">
        <h2 id={`${reasonId}-title`} className="text-lg font-semibold">
          {blockedDate ? BLOCKED_DATE_TEXT.unblockTitle : BLOCKED_DATE_TEXT.blockTitle}
        </h2>
        <p className="text-sm text-muted-foreground">
          {formatLongDate(date)}
        </p>
      </header>

      <form
        className="space-y-4"
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
      >
        {blockedDate ? (
          <>
            <p className="text-sm">{BLOCKED_DATE_TEXT.blockedNotice}</p>
            {blockedDate.reason && (
              <p className="text-sm wrap-anywhere">
                {BLOCKED_DATE_TEXT.reasonPrefix} {blockedDate.reason}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm">{BLOCKED_DATE_TEXT.blockHint}</p>
            {isPast && (
              <p role="alert" className="text-sm text-destructive">
                {BLOCKED_DATE_PAST_ERROR}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor={reasonId}>{BLOCKED_DATE_TEXT.reasonLabel}</Label>
              <Textarea
                id={reasonId}
                value={reason}
                disabled={isBusy || isPast}
                aria-invalid={Boolean(error)}
                aria-describedby={`${reasonId}-count${error ? ` ${reasonId}-error` : ""}`}
                onChange={(event) => {
                  setReason(event.target.value);
                  setValidationError(null);
                }}
              />
              <p
                id={`${reasonId}-count`}
                className="text-sm text-muted-foreground"
              >
                {reason.length}/{BLOCKED_DATE_REASON_MAX_LENGTH} {BLOCKED_DATE_TEXT.charactersUnit}
              </p>
              {error && (
                <p
                  id={`${reasonId}-error`}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {error}
                </p>
              )}
            </div>
          </>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isBusy}
          >
            {BLOCKED_DATE_TEXT.cancel}
          </Button>
          <Button
            type="submit"
            disabled={isBusy || (!blockedDate && (isPast || reasonTooLong))}
          >
            {isBusy
              ? BLOCKED_DATE_TEXT.saving
              : blockedDate
                ? BLOCKED_DATE_TEXT.unblockTitle
                : BLOCKED_DATE_TEXT.blockTitle}
          </Button>
        </div>
      </form>
    </aside>
  );
}
