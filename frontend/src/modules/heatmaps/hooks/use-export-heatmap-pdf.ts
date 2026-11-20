"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { downloadFile } from "@/shared/utils/download-file";
import { HEATMAP_TEXT, HEATMAP_TOAST_OPTIONS } from "../constants/heatmap-text.constants";
import { heatmapsService } from "../services/heatmaps.service";
import type { HeatmapFilters } from "../types/heatmap-filters.types";
import type { HeatmapType } from "../types/heatmap-type.types";

export function useExportHeatmapPdf(type: HeatmapType, filters: HeatmapFilters) {
  const mutation = useMutation({
    mutationFn: () => heatmapsService.exportHeatmapPdf(type, filters),
    onSuccess: ({ file, fileName }) => {
      downloadFile(file, fileName);
      toast.success(HEATMAP_TEXT.pdfReady, HEATMAP_TOAST_OPTIONS);
    },
    onError: () => {
      toast.error(HEATMAP_TEXT.pdfError, HEATMAP_TOAST_OPTIONS);
    },
  });

  return { exportPdf: mutation.mutate, isExportingPdf: mutation.isPending };
}
