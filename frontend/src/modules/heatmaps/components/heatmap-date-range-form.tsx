"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ReportFilterSelect } from "@/modules/reports";
import { HEATMAP_FILTER_TEXT, HEATMAP_FIRST_YEAR, HEATMAP_LAST_YEAR, HEATMAP_SEMESTER_OPTIONS, HEATMAP_YEAR_OPTIONS } from "../constants/heatmap-filters.constants";
import type { HeatmapDateRangeFormProps } from "../types/heatmap-component-props.types";
import type { HeatmapSemester, HeatmapSemesterRange } from "../types/heatmap-filters.types";
import { isValidSemesterRange } from "../utils/semester-range-to-timestamps";

const DEFAULT_RANGE: HeatmapSemesterRange = { startYear: HEATMAP_FIRST_YEAR, startSemester: 1, endYear: HEATMAP_LAST_YEAR, endSemester: 2 };

export function HeatmapDateRangeForm({ value, onCancel, onApply }: HeatmapDateRangeFormProps) {
  const [range, setRange] = useState<HeatmapSemesterRange>(value ?? DEFAULT_RANGE);
  const [error, setError] = useState<string | undefined>(undefined);

  const update = (patch: Partial<HeatmapSemesterRange>) => {
    setRange((current) => ({ ...current, ...patch }));
    setError(undefined);
  };

  const handleApply = () => {
    if (!isValidSemesterRange(range)) {
      setError(HEATMAP_FILTER_TEXT.rangeError);
      return;
    }
    onApply(range);
  };

  const renderSection = (title: string, yearKey: "startYear" | "endYear", semesterKey: "startSemester" | "endSemester") => (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold text-ink">{title}</legend>
      <div className="flex flex-col gap-3 sm:flex-row">
        <ReportFilterSelect
          label={`${HEATMAP_FILTER_TEXT.yearField} (${title})`}
          options={HEATMAP_YEAR_OPTIONS}
          value={String(range[yearKey])}
          onChange={(year) => year && update({ [yearKey]: Number(year) })}
        />
        <ReportFilterSelect
          label={`${HEATMAP_FILTER_TEXT.semesterField} (${title})`}
          options={HEATMAP_SEMESTER_OPTIONS}
          value={`${range[semesterKey]}`}
          onChange={(semester) => semester && update({ [semesterKey]: Number(semester) as HeatmapSemester })}
        />
      </div>
    </fieldset>
  );

  return (
    <>
      <div className="flex flex-col gap-5">
        {renderSection(HEATMAP_FILTER_TEXT.startSection, "startYear", "startSemester")}
        {renderSection(HEATMAP_FILTER_TEXT.endSection, "endYear", "endSemester")}
        {error && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {HEATMAP_FILTER_TEXT.cancel}
        </Button>
        <Button type="button" onClick={handleApply}>
          {HEATMAP_FILTER_TEXT.apply}
        </Button>
      </DialogFooter>
    </>
  );
}
