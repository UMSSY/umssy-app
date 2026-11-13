"use client";

import { CalendarRange } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HEATMAP_FILTER_TEXT } from "../constants/heatmap-filters.constants";
import type { HeatmapDateRangeDialogProps } from "../types/heatmap-component-props.types";
import { HeatmapDateRangeForm } from "./heatmap-date-range-form";

export function HeatmapDateRangeDialog({ open, onOpenChange, value, onApply }: HeatmapDateRangeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-ink">
            <CalendarRange className="size-5 text-accent" aria-hidden="true" />
            {HEATMAP_FILTER_TEXT.dialogTitle}
          </DialogTitle>
          <DialogDescription className="text-text-secondary">{HEATMAP_FILTER_TEXT.dialogDescription}</DialogDescription>
        </DialogHeader>
        <HeatmapDateRangeForm value={value} onCancel={() => onOpenChange(false)} onApply={onApply} />
      </DialogContent>
    </Dialog>
  );
}
