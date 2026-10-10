"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TIME_OPTIONS } from "../constants/availability.constants";
import type { TimeSelectProps } from "../types/time-select-props.types";

export function TimeSelect({ id, value, onValueChange, invalid, describedBy }: TimeSelectProps) {
  return (
    <Select name={id} value={value || null} onValueChange={(nextValue) => onValueChange(nextValue ?? "")}>
      <SelectTrigger id={id} aria-invalid={invalid || undefined} aria-describedby={describedBy} className="h-10 w-full">
        <SelectValue placeholder="--:--" />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="max-h-[min(200px,var(--available-height))]">
        {TIME_OPTIONS.map((time) => (
          <SelectItem key={time} value={time}>{time}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
