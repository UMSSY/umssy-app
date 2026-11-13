"use client";

import { CalendarRange, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportFilterSelect } from "@/modules/reports";
import { HEATMAP_FILTER_TEXT, HEATMAP_MONTH_OPTIONS, HEATMAP_PROMOTION_OPTIONS, HEATMAP_YEAR_OPTIONS } from "../constants/heatmap-filters.constants";
import type { HeatmapToolbarProps } from "../types/heatmap-component-props.types";
import { formatSemesterRange } from "../utils/semester-range-to-timestamps";
import { HeatmapExportMenu } from "./heatmap-export-menu";

export function HeatmapToolbar({
  config,
  filters,
  careerOptions,
  onCareerChange,
  onPromotionChange,
  onYearChange,
  onMonthChange,
  onOpenDateRange,
  onClearDateRange,
  onExport,
  canExport,
}: HeatmapToolbarProps) {
  const range = filters.semesterRange;

  return (
    <div role="search" aria-label="Filtros del mapa de calor" className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
        {config.showCareerFilter && (
          <ReportFilterSelect label={HEATMAP_FILTER_TEXT.careerLabel} allLabel={HEATMAP_FILTER_TEXT.allCareers} options={careerOptions} value={filters.careerId} onChange={onCareerChange} />
        )}
        {config.showPromotionFilter && (
          <ReportFilterSelect label={HEATMAP_FILTER_TEXT.promotionLabel} allLabel={HEATMAP_FILTER_TEXT.allPromotions} options={HEATMAP_PROMOTION_OPTIONS} value={filters.promotion} onChange={onPromotionChange} />
        )}
        <div className="flex w-full flex-col gap-1 sm:w-72">
          <ReportFilterSelect
            label={HEATMAP_FILTER_TEXT.yearLabel}
            allLabel={HEATMAP_FILTER_TEXT.allYears}
            options={HEATMAP_YEAR_OPTIONS}
            value={range ? undefined : filters.year}
            onChange={onYearChange}
            disabled={Boolean(range)}
          />
          {range && <p className="px-1 text-xs text-text-secondary">{HEATMAP_FILTER_TEXT.yearOverridden}</p>}
        </div>
        {config.showMonthFilter && (
          <ReportFilterSelect label={HEATMAP_FILTER_TEXT.monthLabel} allLabel={HEATMAP_FILTER_TEXT.allMonths} options={HEATMAP_MONTH_OPTIONS} value={filters.month} onChange={onMonthChange} />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={range ? "default" : "outline"}
          onClick={onOpenDateRange}
          aria-pressed={Boolean(range)}
          className="gap-2"
        >
          <CalendarRange className="size-4" aria-hidden="true" />
          {range ? `${HEATMAP_FILTER_TEXT.dateRangeButton}: ${formatSemesterRange(range)}` : HEATMAP_FILTER_TEXT.dateRangeButton}
        </Button>
        {range && (
          <Button type="button" variant="ghost" size="icon" onClick={onClearDateRange} aria-label={HEATMAP_FILTER_TEXT.clearDateRange} title={HEATMAP_FILTER_TEXT.clearDateRange}>
            <X className="size-4" aria-hidden="true" />
          </Button>
        )}
        <HeatmapExportMenu onExport={onExport} disabled={!canExport} />
      </div>
    </div>
  );
}
