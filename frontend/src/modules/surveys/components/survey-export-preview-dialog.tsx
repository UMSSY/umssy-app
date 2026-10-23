"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SURVEY_REPORT_MESSAGES } from "../constants/survey-report.constants";
import type { SurveyExportPreviewDialogProps } from "../types/survey-export-preview.types";

// Vista previa del reporte antes de descargarlo (CA 2 de la HU5).
export function SurveyExportPreviewDialog({ preview, onDownload, onClose }: SurveyExportPreviewDialogProps) {
  return (
    <Dialog open={preview !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[90vh] flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-tight text-xl text-ink">{SURVEY_REPORT_MESSAGES.previewTitle}</DialogTitle>
          <DialogDescription>{preview?.fileName}</DialogDescription>
        </DialogHeader>
        {preview && (
          <iframe title={SURVEY_REPORT_MESSAGES.previewTitle} src={preview.url} className="min-h-0 w-full flex-1 rounded-md border border-border" />
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={onDownload} className="gap-2 bg-ink text-surface hover:bg-ink-soft">
            <Download className="size-4" aria-hidden="true" />
            {SURVEY_REPORT_MESSAGES.download}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
