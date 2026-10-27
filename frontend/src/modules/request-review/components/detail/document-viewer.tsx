"use client";

import { useState } from "react";
import { Download, Expand, FileText, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import type { DocumentViewerProps } from "../../types/document-viewer-props.types";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;
const PDF_VIEWER_FRAGMENT = "#toolbar=0&navpanes=0&view=FitH";
const TOOL_CLASS = "bg-surface/10 text-surface hover:bg-surface/20 hover:text-surface";

export function DocumentViewer({
  url,
  mimeType,
  fileName,
  caption,
  ocrMarks,
}: DocumentViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const isPdf = mimeType === "application/pdf";
  const hasOcr = Array.isArray(ocrMarks) && ocrMarks.length > 0;
  const showImageTools = !isPdf || hasOcr;
  const transformStyle = { transform: `scale(${scale}) rotate(${rotation}deg)` };

  function handleReset() {
    setScale(1);
    setRotation(0);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-[#0F172A] shadow-md">
      {/* Barra de herramientas (CA13) */}
      <div
        className="flex items-center gap-2 border-b border-surface/10 px-4 py-3"
        role="toolbar"
        aria-label="Herramientas del documento"
      >
        <FileText className="size-4 shrink-0 text-surface" strokeWidth={1.75} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-surface">{fileName}</span>

        {showImageTools && (
          <>
            <span className="text-xs text-surface/70" aria-live="polite">
              {Math.round(scale * 100)} %
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              className={TOOL_CLASS}
              aria-label="Acercar"
              onClick={() => setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP))}
              disabled={scale >= MAX_SCALE}
            >
              <ZoomIn strokeWidth={1.75} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className={TOOL_CLASS}
              aria-label="Alejar"
              onClick={() => setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP))}
              disabled={scale <= MIN_SCALE}
            >
              <ZoomOut strokeWidth={1.75} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className={TOOL_CLASS}
              aria-label="Rotar"
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              <RotateCw strokeWidth={1.75} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className={TOOL_CLASS}
              aria-label="Ajustar a pantalla"
              onClick={handleReset}
            >
              <Expand strokeWidth={1.75} aria-hidden="true" />
            </Button>
          </>
        )}

        <a
          href={url}
          download={fileName}
          rel="noopener noreferrer"
          aria-label="Descargar"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), TOOL_CLASS)}
        >
          <Download strokeWidth={1.75} aria-hidden="true" />
        </a>
      </div>

      {/* Área del documento real con superposición OCR */}
      <div
        className={
          isPdf && !hasOcr
            ? "flex h-[36rem] items-center justify-center p-4"
            : "relative flex h-[38rem] items-center justify-center overflow-hidden p-3 sm:p-4"
        }
      >
        {isPdf ? (
          <div
            className="relative size-full origin-center transition-transform duration-150"
            style={transformStyle}
            data-testid="ocr-document-canvas"
          >
            <iframe
              src={`${url}${PDF_VIEWER_FRAGMENT}`}
              title="Documento de respaldo"
              className="size-full rounded border-0 bg-surface"
            />
            {hasOcr && (
              <div className="pointer-events-none absolute inset-0 size-full">
                {ocrMarks
                  .filter((mark) => mark.bbox !== undefined)
                  .map((mark) => {
                    const { bbox, isDoubtful, label, confidence, fieldKey } = mark;
                    if (!bbox) return null;

                    const isRed = isDoubtful;

                    return (
                      <div
                        key={fieldKey}
                        className={cn(
                          "absolute rounded-xs transition-colors",
                          isRed
                            ? "border-2 border-dashed border-red-500 bg-red-500/10"
                            : "border-2 border-dashed border-[#D97706] bg-[#F59E0B]/10",
                        )}
                        style={{
                          left: `${bbox.x}%`,
                          top: `${bbox.y}%`,
                          width: `${bbox.width}%`,
                          height: `${bbox.height}%`,
                        }}
                        data-testid={`ocr-mark-${fieldKey}`}
                      >
                        <span
                          className={cn(
                            "absolute -top-3 left-1 flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold whitespace-nowrap text-white shadow-sm",
                            isRed ? "bg-red-600" : "bg-[#B45309]",
                          )}
                          data-testid={`ocr-label-${fieldKey}`}
                        >
                          {label} · {confidence}%
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ) : (
          <div
            className="relative inline-flex max-w-full items-center justify-center"
            data-testid="ocr-document-canvas"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Documento de respaldo"
              className="max-h-[32rem] max-w-full origin-center rounded bg-surface object-contain shadow-sm transition-transform"
              style={transformStyle}
            />
            {hasOcr && (
              <div
                className="pointer-events-none absolute inset-0 size-full origin-center transition-transform"
                style={transformStyle}
              >
                {ocrMarks
                  .filter((mark) => mark.bbox !== undefined)
                  .map((mark) => {
                    const { bbox, isDoubtful, label, confidence, fieldKey } = mark;
                    if (!bbox) return null;

                    const isRed = isDoubtful;

                    return (
                      <div
                        key={fieldKey}
                        className={cn(
                          "absolute rounded-xs transition-colors",
                          isRed
                            ? "border-2 border-dashed border-red-500 bg-red-500/10"
                            : "border-2 border-dashed border-[#D97706] bg-[#F59E0B]/10",
                        )}
                        style={{
                          left: `${bbox.x}%`,
                          top: `${bbox.y}%`,
                          width: `${bbox.width}%`,
                          height: `${bbox.height}%`,
                        }}
                        data-testid={`ocr-mark-${fieldKey}`}
                      >
                        <span
                          className={cn(
                            "absolute -top-3 left-1 flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold whitespace-nowrap text-white shadow-sm",
                            isRed ? "bg-red-600" : "bg-[#B45309]",
                          )}
                          data-testid={`ocr-label-${fieldKey}`}
                        >
                          {label} · {confidence}%
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {caption ? (
        <p className="border-t border-surface/10 px-4 py-3 text-xs text-surface/70">{caption}</p>
      ) : null}
    </div>
  );
}
