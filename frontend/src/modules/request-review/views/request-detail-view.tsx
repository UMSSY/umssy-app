"use client";

import { useMemo, useState } from "react";
import { AlertCircle, FileText, History, TableProperties } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { DetailHeader } from "../components/layout/backoffice-page-header";
import { DataContrastPanel } from "../components/detail/data-contrast-panel";
import { DocumentViewer } from "../components/detail/document-viewer";
import { HistoryCard } from "../components/detail/history-card";
import { StatusBadge } from "../components/common/status-badge";
import { VerdictPanel } from "../components/detail/verdict-panel";
import { DOCUMENT_TYPE_LABELS } from "../constants/request-review.constants";
import { useDocumentUrl } from "../hooks/use-document-url";
import { useRequestDetail } from "../hooks/use-request-detail";
import { formatLongDate } from "../utils/format-long-date";
import { generateOcrAnalysis } from "../utils/ocr-analysis";
import type { RequestDetailViewProps } from "../types/request-detail-view-props.types";

export function RequestDetailView({ id }: RequestDetailViewProps) {
  const { detail, error, isLoading } = useRequestDetail(id);
  const document = useDocumentUrl(id, Boolean(detail?.document));
  const sentAt = formatLongDate(detail?.history?.submittedAt);
  const [mobileTab, setMobileTab] = useState<"contrast" | "document" | "history">("contrast");

  // Genera el análisis OCR cuando la solicitud tiene documento y fecha de envío
  const ocrAnalysis = useMemo(() => {
    if (!detail || !detail.document || !detail.history?.submittedAt) return null;
    return generateOcrAnalysis(detail);
  }, [detail]);

  const recipientFullName = detail ? `${detail.firstName} ${detail.lastName}`.trim() : "";

  return (
    <main className="mx-auto w-full max-w-7xl min-w-0">
      <DetailHeader requestCode={detail?.requestCode} />

      <section className="flex w-full min-w-0 flex-col gap-6">
        {isLoading && (
          <div className="flex flex-col gap-4" data-testid="detail-skeleton">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-96 w-full" />
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-border bg-surface p-4 text-sm text-ink">
            {error}
          </p>
        )}

        {detail && (
          <>
            {/* Cabecera con Nombre, Estado y Motivo de revisión manual (CA12) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-tight text-3xl font-bold text-ink">
                  {recipientFullName}
                </h1>
                <StatusBadge status={detail.status} />

                {/* Motivo de la revisión manual junto al estado (CA12) */}
                {ocrAnalysis && !ocrAnalysis.isClear && ocrAnalysis.manualReviewReason && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
                    data-testid="manual-review-reason-badge"
                  >
                    <AlertCircle className="size-3.5 text-amber-600" aria-hidden="true" />
                    <span>Revisión manual: {ocrAnalysis.manualReviewReason}</span>
                  </span>
                )}
              </div>

              <p className="text-base text-text-secondary">
                {detail.career}
                {sentAt ? `. Solicitud enviada el ${sentAt}.` : "."}
              </p>
            </div>

            {/* Pestañas para dispositivos móviles (CA15) */}
            <div
              className="flex rounded-lg border border-border bg-surface-soft p-1 text-xs font-semibold lg:hidden"
              role="tablist"
              aria-label="Vistas de la solicitud"
              data-testid="mobile-tabs-container"
            >
              <Button
                variant="ghost"
                role="tab"
                aria-selected={mobileTab === "contrast"}
                onClick={() => setMobileTab("contrast")}
                className={cn(
                  "flex h-auto flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs transition-all",
                  mobileTab === "contrast"
                    ? "bg-surface text-ink shadow-xs"
                    : "text-text-secondary hover:text-ink",
                )}
              >
                <TableProperties className="size-4" aria-hidden="true" />
                <span>Contraste</span>
                {ocrAnalysis && (
                  <span
                    className={cn(
                      "rounded px-1 text-[10px] font-bold",
                      ocrAnalysis.pendingCount === 0
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800",
                    )}
                  >
                    {ocrAnalysis.pendingCount === 0 ? "OK" : "Revisar"}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                role="tab"
                aria-selected={mobileTab === "document"}
                onClick={() => setMobileTab("document")}
                className={cn(
                  "flex h-auto flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs transition-all",
                  mobileTab === "document"
                    ? "bg-surface text-ink shadow-xs"
                    : "text-text-secondary hover:text-ink",
                )}
              >
                <FileText className="size-4" aria-hidden="true" />
                <span>Documento</span>
              </Button>

              <Button
                variant="ghost"
                role="tab"
                aria-selected={mobileTab === "history"}
                onClick={() => setMobileTab("history")}
                className={cn(
                  "flex h-auto flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs transition-all",
                  mobileTab === "history"
                    ? "bg-surface text-ink shadow-xs"
                    : "text-text-secondary hover:text-ink",
                )}
              >
                <History className="size-4" aria-hidden="true" />
                <span>Historial</span>
              </Button>
            </div>

            {/* Cuadrícula de dos columnas: se adapta tanto a escritorio como a pestañas en móvil */}
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.37fr)_minmax(0,1fr)]">
              {/* Columna Izquierda: Visor del documento con OCR interactivo (CA1, CA2, CA3, CA4, CA5, CA13) */}
              <div className={cn("min-w-0", mobileTab !== "document" && "max-lg:hidden")}>
                {!detail.document && (
                  <p className="rounded-lg border border-border bg-surface p-4 text-sm text-text-secondary">
                    Esta solicitud no tiene un documento adjunto.
                  </p>
                )}
                {detail.document && document.isLoading && <Skeleton className="h-[32rem] w-full" />}
                {detail.document && document.error && (
                  <p role="alert" className="rounded-lg border border-border bg-surface p-4 text-sm text-ink">
                    {document.error}
                  </p>
                )}
                {detail.document && document.url && (
                  <DocumentViewer
                    url={document.url}
                    mimeType={detail.document.mimeType}
                    fileName={`${detail.document.name}.${detail.document.extension}`}
                    caption={`Documento: ${DOCUMENT_TYPE_LABELS[detail.document.type] ?? detail.document.type}`}
                    ocrMarks={ocrAnalysis?.fields}
                    recipientName={recipientFullName}
                    careerTitle={detail.career}
                    graduationYear={detail.graduationYear}
                  />
                )}
              </div>

              {/* Columna Derecha: Contraste OCR, Dictamen e Historial (CA6, CA7, CA8, CA9, CA10, CA11, CA14) */}
              <div className="flex min-w-0 flex-col gap-6">
                <div className={cn(mobileTab !== "contrast" && "max-lg:hidden")}>
                  <DataContrastPanel detail={detail} ocrAnalysis={ocrAnalysis ?? undefined} />
                </div>
                <div className={cn(mobileTab !== "contrast" && "max-lg:hidden")}>
                  <VerdictPanel detail={detail} />
                </div>
                <div className={cn(mobileTab !== "history" && "max-lg:hidden")}>
                  <HistoryCard detail={detail} ocrReadAt={ocrAnalysis?.readAt} />
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
