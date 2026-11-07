"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { APPLICATION_MESSAGES } from "../constants/application.constants";
import type { ShowWithdrawnSwitchProps } from "../types/show-withdrawn-switch-props.types";

export function ShowWithdrawnSwitch({ checked, onCheckedChange, count }: ShowWithdrawnSwitchProps) {
  const labelId = useId();

  return (
    <div className="flex items-center gap-3">
      <Switch aria-labelledby={labelId} checked={checked} onCheckedChange={onCheckedChange} />
      <Label id={labelId} className="text-sm text-text-secondary">
        {APPLICATION_MESSAGES.showWithdrawn} ({count})
      </Label>
    </div>
  );
}
