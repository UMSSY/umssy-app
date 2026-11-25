"use client";

import { AlertCircle, ExternalLink, FileText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentViewer } from "../detail/document-viewer";
import type { CompanyDocumentPanelProps } from "../../types/company-document-panel-props.types";

export function CompanyRequestDocumentPanel({
  requestCode,
  docUrl,
  docIsImage,
  docMimeType,
  docError,
  isRetrying = false,
  onRetry,
}: CompanyDocumentPanelProps) {
  return (
    <section
      className="space-y-3 lg:sticky lg:top-6 lg:col-span-6"
      aria-labelledby="section-document"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-primary" aria-hidden="true" />
          <h2 id="section-document" className="text-base font-bold text-ink">
            Documento de Respaldo Oficial
          </h2>
        </div>
        {docUrl && (
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-surface-soft"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" /> Abrir en nueva pestaña
          </a>
        )}
      </div>

      <Card className="overflow-hidden border-border bg-surface shadow-xs">
        <CardContent className="p-0">
          {docUrl ? (
            <DocumentViewer
              url={docUrl}
              mimeType={docMimeType}
              fileName={`carta-solicitud-${requestCode ?? "doc"}.${docIsImage ? "png" : "pdf"}`}
              caption="Carta formal con membrete y sello presentada para la solicitud de acceso institucional a UMSSY."
            />
          ) : docError ? (
            <div
              role="alert"
              className="flex h-64 flex-col items-center justify-center p-8 text-center"
            >
              <AlertCircle
                className="mb-2 size-10 text-destructive"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold text-ink">{docError}</p>
              <p className="mt-1 text-xs text-text-secondary">
                Puedes continuar revisando los datos de la empresa o reintentar la descarga.
              </p>
              {onRetry ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="mt-4 gap-1.5"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  {isRetrying ? "Reintentando..." : "Reintentar descarga"}
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center p-8 text-center text-text-secondary">
              <FileText className="mb-2 size-12 text-slate-300" aria-hidden="true" />
              <p className="text-sm font-medium">
                No se pudo cargar la vista previa del documento adjunto.
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                El archivo podría estar en procesamiento o no encontrarse disponible.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
