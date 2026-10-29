"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AVAILABILITY_STATUS_TEXT } from "../constants/availability-status.constants";
import { useAvailabilityStatus } from "../hooks/use-availability-status";

export function ReceiveRequestsSwitch() {
  const labelId = useId();
  const { isAvailable, isLoading, hasError, isUpdating, setAvailable } = useAvailabilityStatus();
  const hint = hasError
    ? AVAILABILITY_STATUS_TEXT.loadError
    : isAvailable
      ? AVAILABILITY_STATUS_TEXT.activeHint
      : AVAILABILITY_STATUS_TEXT.pausedHint;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <div className="min-w-0">
        <Label id={labelId}>{AVAILABILITY_STATUS_TEXT.label}</Label>
        {!isLoading && (
          <p className={hasError ? "mt-1 text-xs text-destructive" : "mt-1 text-xs text-text-secondary"}>{hint}</p>
        )}
      </div>
      <Switch
        aria-labelledby={labelId}
        checked={isAvailable}
        disabled={isLoading || hasError || isUpdating}
        onCheckedChange={setAvailable}
      />
    </div>
  );
}
