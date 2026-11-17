"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SELECT_ITEM_CONTRAST_CLASS } from "@/shared/constants/select.constants";
import { APPLICATION_MESSAGES } from "../constants/application.constants";
import type { ApplicationStatusFilter } from "../types/application-status-filter.types";
import type { ApplicationsStatusSelectProps } from "../types/applications-status-select-props.types";
import { getStatusOptions } from "../utils/get-status-options";

export function ApplicationsStatusSelect({ value, onValueChange, showWithdrawn }: ApplicationsStatusSelectProps) {
  const labelId = useId();
  const options = getStatusOptions(showWithdrawn);

  return (
    <div className="flex items-center gap-2">
      <Label id={labelId} className="text-text-secondary">
        {APPLICATION_MESSAGES.show}
      </Label>
      <Select
        items={options}
        value={value}
        onValueChange={(next) => {
          if (next) onValueChange(next as ApplicationStatusFilter);
        }}
      >
        <SelectTrigger aria-labelledby={labelId} className="min-w-40 font-semibold text-ink">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className={SELECT_ITEM_CONTRAST_CLASS}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
