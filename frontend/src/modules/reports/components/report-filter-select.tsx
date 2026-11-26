"use client";

import { useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { ReportFilterSelectProps } from "../types/report-filter-select-props.types";

export function ReportFilterSelect<TValue extends string>({
  label,
  allLabel,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
}: ReportFilterSelectProps<TValue>) {
  const labelId = useId();
  const items = allLabel ? [{ value: "ALL", label: allLabel }, ...options] : options;
  const selectedValue = value ?? (allLabel ? "ALL" : null);

  const handleValueChange = (selectedValue: string | null) => {
    onChange(!selectedValue || selectedValue === "ALL" ? undefined : (selectedValue as TValue));
  };

  return (
    <div className="w-full sm:w-72 sm:shrink-0">
      <Select items={items} value={selectedValue} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger
          aria-labelledby={labelId}
          className="w-full cursor-pointer rounded-md border-border bg-surface px-3 pt-1.5 pb-2 hover:border-ink-soft hover:bg-surface-soft focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-interaction data-popup-open:border-accent data-popup-open:ring-3 data-popup-open:ring-interaction data-[size=default]:h-auto"
        >
          <span className="flex flex-1 flex-col items-start">
            <span id={labelId} className="text-xs text-text-secondary">
              {label}
            </span>
            <SelectValue placeholder={placeholder} className="text-sm text-ink" />
          </span>
        </SelectTrigger>

        <SelectContent alignItemWithTrigger={false} className="rounded-md bg-surface py-1 ring-border">
          {items.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              variant="subtle"
              className="rounded-none px-3 py-2 text-ink-soft data-selected:font-semibold"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
