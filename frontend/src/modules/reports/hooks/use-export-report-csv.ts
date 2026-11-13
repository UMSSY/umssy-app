"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { downloadFile } from "@/shared/utils/download-file";
import { saveFile, selectCsvDestination } from "@/shared/utils/save-file";
import { REPORT_ALERT_DURATION_MS } from "../constants/reports.constants";
import type { ExportedFile } from "../types/registered-user.types";
import type { ReportExportFormat, ReportExportScope } from "../types/report-export.types";
import type { ReportPdfOptions } from "../types/report-pdf.types";
import { resolveReportAuthor } from "../utils/report-author.util";
import { createReportPdf } from "../utils/report-pdf.util";

const DEFAULT_PDF_OPTIONS: ReportPdfOptions = {
  title: "Reporte de usuarios",
  subtitle: "Personas registradas en la plataforma",
  dateColumnLabel: "Fecha de registro",
  filters: [],
};

export function useExportReportCsv(
  exportReport: (scope: ReportExportScope, format: ReportExportFormat) => Promise<ExportedFile>,
  suggestedFileName: string,
  pdfOptions: ReportPdfOptions = DEFAULT_PDF_OPTIONS,
) {
  const exportInProgress = useRef(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = setTimeout(() => setSuccessMessage(undefined), 4000);

    return () => clearTimeout(timeoutId);
  }, [successMessage]);

  const exportCsv = useCallback(async (format: ReportExportFormat = "csv", scope: ReportExportScope = "filtered") => {
    if (exportInProgress.current) return;
    exportInProgress.current = true;
    setIsExporting(true);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    try {
      const destination = format === "csv" ? selectCsvDestination(suggestedFileName) : undefined;
      let fileHandle;

      if (destination) {
        try {
          fileHandle = await destination;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          throw error;
        }
      }

      const exportedFile = await exportReport(scope, format);
      const { file, fileName } = format === "pdf"
        ? await createReportPdf(exportedFile.file, exportedFile.fileName, {
          ...pdfOptions,
          generatedBy: await resolveReportAuthor(),
          generatedAt: new Date(),
        })
        : exportedFile;
      if (fileHandle) {
        await saveFile(file, fileHandle);
      } else {
        downloadFile(file, fileName);
      }
      setSuccessMessage("La exportación de la tabla ha sido un éxito");
    } catch {
      setErrorMessage("No se pudo exportar el reporte. Inténtalo de nuevo.");
      toast.error("No se pudo exportar el reporte. Inténtalo de nuevo.", {
        duration: REPORT_ALERT_DURATION_MS,
        closeButton: true,
        richColors: true,
      });
    } finally {
      exportInProgress.current = false;
      setIsExporting(false);
    }
  }, [exportReport, pdfOptions, suggestedFileName]);

  return { exportCsv, isExporting, errorMessage, successMessage };
}
