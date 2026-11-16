"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadFile } from "@/shared/utils/download-file";
import { CV_ERROR_MESSAGES } from "../constants/cv-error-messages.constants";
import type { CvPreview } from "../types/cv-preview.types";
import type { CvViewerDialogProps } from "../types/cv-viewer-dialog-props.types";
import { formatUploadDate } from "../utils/format-upload-date";

function CvViewerDialogBody({ preview, onClose }: { preview: CvPreview; onClose: () => void }) {
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = () => {
    setDownloadError(null);
    try {
      downloadFile(preview.file, preview.cv.fileName);
    } catch {
      setDownloadError(CV_ERROR_MESSAGES.download);
    }
  };

  return (
    <Dialog open onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
      <DialogContent
        showCloseButton={false}
        className="max-w-3xl gap-4 rounded-lg border border-border bg-surface p-6 text-ink ring-0 sm:max-w-3xl"
      >
        <DialogHeader>
          <DialogTitle className="font-tight text-xl font-bold text-ink">
            Vista previa del CV
          </DialogTitle>
          <DialogDescription className="text-sm break-all text-text-secondary">
            {preview.cv.fileName} · Subido el {formatUploadDate(preview.cv.updatedAt)}
          </DialogDescription>
        </DialogHeader>
        <iframe
          src={preview.previewUrl}
          title={`Vista previa de ${preview.cv.fileName}`}
          className="h-[60vh] w-full rounded-lg border border-border"
        />
        {downloadError ? (
          <p role="alert" className="text-sm text-danger">
            {downloadError}
          </p>
        ) : null}
        <DialogFooter className="mx-0 mb-0 flex-row justify-end gap-3 rounded-b-2xl border-t-0 bg-transparent p-0">
          <Button
            type="button"
            variant="outline"
            className="h-11 border-border-strong px-5 text-sm text-ink hover:bg-surface-soft"
            onClick={onClose}
          >
            Cerrar
          </Button>
          <Button
            type="button"
            className="h-11 bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-brand-hover"
            onClick={handleDownload}
          >
            <Download aria-hidden="true" className="size-4" />
            Descargar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CvViewerDialog({ preview, onClose }: CvViewerDialogProps) {
  if (!preview) {
    return null;
  }

  return <CvViewerDialogBody key={preview.previewUrl} preview={preview} onClose={onClose} />;
}
