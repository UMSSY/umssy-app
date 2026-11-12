"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCareers } from "@/modules/surveys";
import { PageBreadcrumb, WorkspacePage } from "@/shared/components/layout";
import { downloadFile } from "@/shared/utils/download-file";
import { HeatmapBaseIndicator } from "../components/heatmap-base-indicator";
import { HeatmapDateRangeDialog } from "../components/heatmap-date-range-dialog";
import { HeatmapLegend } from "../components/heatmap-legend";
import { HeatmapMatrix } from "../components/heatmap-matrix";
import { HeatmapQuickRead } from "../components/heatmap-quick-read";
import { HeatmapToolbar } from "../components/heatmap-toolbar";
import { HEATMAPS_BASE_PATH } from "../constants/heatmap-routes.constants";
import { HEATMAP_TEXT } from "../constants/heatmap-text.constants";
import { HEATMAP_VIEW_CONFIGS } from "../constants/heatmap-views.constants";
import { useHeatmap } from "../hooks/use-heatmap";
import { useHeatmapFilters } from "../hooks/use-heatmap-filters";
import type { HeatmapExportFormat, HeatmapViewProps } from "../types/heatmap-component-props.types";
import type { HeatmapSemesterRange } from "../types/heatmap-filters.types";
import { heatmapToCsv } from "../utils/heatmap-to-csv";

export function HeatmapView({ type }: HeatmapViewProps) {
  const config = HEATMAP_VIEW_CONFIGS[type];
  const { filters, setCareer, setYear, setMonth, setSemesterRange } = useHeatmapFilters();
  const { data, isLoading, hasError, refetch } = useHeatmap(type, filters);
  const { careers } = useCareers();
  const careerOptions = (careers ?? []).map((career) => ({ value: career.id, label: career.title }));
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const canExport = Boolean(data && data.baseCount > 0) && !isLoading;

  const handleExport = (format: HeatmapExportFormat) => {
    if (!data) return;
    if (format === "pdf") {
      // TODO: Conectar con GET /analytics/heatmap/:type/export?format=pdf cuando el backend genere el documento.
      toast.info(HEATMAP_TEXT.pdfPending, { duration: 4000, closeButton: true });
      return;
    }
    downloadFile(new Blob([`\uFEFF${heatmapToCsv(data)}`], { type: "text/csv;charset=utf-8" }), `mapa-calor-${type}.csv`);
    toast.success(HEATMAP_TEXT.csvReady, { duration: 4000, closeButton: true });
  };

  const handleApplyRange = (range: HeatmapSemesterRange) => {
    setSemesterRange(range);
    setIsDateRangeOpen(false);
  };

  return (
    <WorkspacePage title={config.title} description={config.subtitle}>
      <PageBreadcrumb
        items={[
          { label: HEATMAP_TEXT.home, href: "/dashboard" },
          { label: HEATMAP_TEXT.administration, href: "/backoffice" },
          { label: HEATMAP_TEXT.section, href: HEATMAPS_BASE_PATH },
          { label: config.navLabel },
        ]}
      />

      <HeatmapToolbar
        config={config}
        filters={filters}
        careerOptions={careerOptions}
        onCareerChange={setCareer}
        onYearChange={setYear}
        onMonthChange={setMonth}
        onOpenDateRange={() => setIsDateRangeOpen(true)}
        onClearDateRange={() => setSemesterRange(undefined)}
        onExport={handleExport}
        canExport={canExport}
      />

      {hasError ? (
        <div role="alert" className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-10 text-center">
          <p className="text-sm font-medium text-destructive">{HEATMAP_TEXT.loadError}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} className="gap-1.5">
            <RefreshCw className="size-3.5" aria-hidden="true" />
            {HEATMAP_TEXT.retry}
          </Button>
        </div>
      ) : (
        <>
          {data && <HeatmapBaseIndicator baseCount={data.baseCount} baseLabel={data.baseLabel} />}
          <HeatmapMatrix
            columns={data?.columns ?? []}
            rows={data?.rows ?? []}
            extraColumnsConfig={data?.extraColumnsConfig}
            cellFormat={config.cellFormat}
            cellUnit={config.cellUnit}
            caption={config.title}
            isLoading={isLoading}
            emptyMessage={config.emptyMessage}
          />
          <HeatmapLegend />
          {data && data.baseCount > 0 && <HeatmapQuickRead summary={data.quickReadSummary} />}
        </>
      )}

      <HeatmapDateRangeDialog open={isDateRangeOpen} onOpenChange={setIsDateRangeOpen} value={filters.semesterRange} onApply={handleApplyRange} />
    </WorkspacePage>
  );
}
