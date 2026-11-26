"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { auditLogRecordsService } from "../services/audit-log-records.service";
import type { AuditLogFilters } from "../types/audit-log-filters.types";

export function useAuditCsvExport() {
  const [isExporting, setIsExporting] = useState(false);
  const busyRef = useRef(false);

  async function exportCsv(filters: AuditLogFilters) {
    // Evita descargas duplicadas mientras se prepara la anterior
    if (busyRef.current) return;
    busyRef.current = true;
    setIsExporting(true);
    try {
      const result = await auditLogRecordsService.exportCsv(filters);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      const url = URL.createObjectURL(result.data.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.data.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Se libera en la siguiente vuelta, cuando la descarga ya empezó
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } finally {
      busyRef.current = false;
      setIsExporting(false);
    }
  }

  return { isExporting, exportCsv };
}
