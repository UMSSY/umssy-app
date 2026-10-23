"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { downloadFile } from "@/shared/utils/download-file";
import { SURVEY_REPORT_MESSAGES } from "../constants/survey-report.constants";
import { SURVEY_TOAST_OPTIONS } from "../constants/surveys.constants";
import type { SurveyExportPreview } from "../types/survey-export-preview.types";
import type { SurveyReportData } from "../types/survey-report.types";
import { getSurveyReportFileName } from "../utils/get-survey-report-file-name";
import { renderSurveyReportPdf } from "../utils/render-survey-report-pdf";

// Flujo de la HU5: generar el PDF, mostrar la vista previa y, al confirmar, avisar con un toast y descargarlo.
export function useExportSurveyPdf() {
  const [preview, setPreview] = useState<SurveyExportPreview | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Libera la URL temporal del PDF cuando se cierra la vista previa.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview.url);
  }, [preview]);

  const generate = useCallback(async (report: SurveyReportData) => {
    setIsGenerating(true);
    try {
      const file = await renderSurveyReportPdf(report);
      setPreview({
        file,
        url: URL.createObjectURL(file),
        fileName: getSurveyReportFileName(report.statistics.survey.title, report.generatedAt),
      });
    } catch {
      toast.error(SURVEY_REPORT_MESSAGES.error, SURVEY_TOAST_OPTIONS);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const download = useCallback(() => {
    if (!preview) return;
    toast.success(SURVEY_REPORT_MESSAGES.success, SURVEY_TOAST_OPTIONS);
    downloadFile(preview.file, preview.fileName);
    setPreview(null);
  }, [preview]);

  const closePreview = useCallback(() => setPreview(null), []);

  return { preview, isGenerating, generate, download, closePreview };
}
