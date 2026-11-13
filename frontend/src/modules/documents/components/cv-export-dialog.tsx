"use client";

import { useState } from "react";
import { ArrowLeft, Download, Eye, Info, LoaderCircle, X } from "lucide-react";
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
import { useCvExport } from "../hooks/use-cv-export";
import type { CvExportDialogProps } from "../types/cv-export-dialog-props.types";
import type { CvExportStep } from "../types/cv-export-step.types";

function CvExportDialogBody({ onClose }: Pick<CvExportDialogProps, "onClose">) {
  const { generatedCv, isGenerating, error, generateCv } = useCvExport();
  const [step, setStep] = useState<CvExportStep>("sections");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const isPreviewing = step === "preview" && generatedCv !== null;

  const handlePreview = async () => {
    setDownloadError(null);
    const cv = generatedCv ?? (await generateCv());

    if (cv) {
      setStep("preview");
    }
  };

  const handleDownload = async () => {
    setDownloadError(null);
    const cv = generatedCv ?? (await generateCv());

    if (!cv) {
      return;
    }

    try {
      downloadFile(cv.file, cv.fileName);
    } catch {
      setDownloadError(CV_ERROR_MESSAGES.download);
    }
  };

  return (
    <Dialog open onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
      <DialogContent
        showCloseButton={false}
        className="max-w-xl gap-0 rounded-lg border border-border bg-surface p-0 text-ink ring-0 sm:max-w-xl"
      >
        <DialogHeader className="gap-1.5 border-b border-border px-6 py-5 pr-14">
          <DialogTitle className="font-tight text-xl font-bold text-ink">
            Generar CV profesional
          </DialogTitle>
          <DialogDescription className="text-sm text-text-secondary">
            Personaliza las secciones y descarga tu currículum en formato PDF.
          </DialogDescription>
        </DialogHeader>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-text-secondary"
          onClick={onClose}
        >
          <X aria-hidden="true" className="size-4" />
        </Button>
        {isPreviewing ? (
          <div className="flex flex-col gap-3 bg-surface-soft px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-ink-soft">
                Vista previa de maquetación institucional (A4)
              </p>
              <Button
                type="button"
                variant="ghost"
                className="h-8 px-2 text-sm font-semibold text-ink"
                onClick={() => setStep("sections")}
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Volver a secciones
              </Button>
            </div>
            <iframe
              src={generatedCv.previewUrl}
              title={`Vista previa de ${generatedCv.fileName}`}
              className="h-[50vh] w-full rounded-lg border border-border bg-surface"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-soft px-4 py-3">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-soft" />
              <p className="text-sm leading-relaxed text-text-secondary">
                El documento se maquetará en plantilla institucional optimizada de 1 a 2 páginas para
                postulaciones laborales.
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="ghost"
                className="h-8 px-2 text-sm font-semibold text-ink"
                disabled={isGenerating}
                onClick={() => void handlePreview()}
              >
                <Eye aria-hidden="true" className="size-4" />
                Previsualizar diseño del PDF
              </Button>
              <p className="text-xs text-text-secondary">Formato A4 · Estándar ATS</p>
            </div>
          </div>
        )}
        {isGenerating ? (
          <p role="status" className="flex items-center gap-2 px-6 pb-4 text-sm text-text-secondary">
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            Generando tu CV...
          </p>
        ) : null}
        {!isGenerating && (error ?? downloadError) ? (
          <p role="alert" className="px-6 pb-4 text-sm text-danger">
            {error ?? downloadError}
          </p>
        ) : null}
        <DialogFooter className="mx-0 mb-0 flex-row justify-end gap-3 rounded-b-lg border-t border-border bg-transparent px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="h-11 border-border-strong px-5 text-sm text-ink hover:bg-surface-soft"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="h-11 bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-brand-hover"
            disabled={isGenerating}
            onClick={() => void handleDownload()}
          >
            <Download aria-hidden="true" className="size-4" />
            Descargar CV en PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CvExportDialog({ isOpen, onClose }: CvExportDialogProps) {
  if (!isOpen) {
    return null;
  }

  return <CvExportDialogBody onClose={onClose} />;
}
