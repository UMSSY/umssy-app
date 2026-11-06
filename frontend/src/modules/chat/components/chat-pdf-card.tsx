"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatPdfCardProps } from "../types/chat-pdf-card-props.types";
import { formatFileSize } from "../utils/attachment-validator";
import { cn } from "@/lib/utils";

export function ChatPdfCard({
  attachment,
  isOwn = false,
  onDownload,
  isDownloading = false,
}: ChatPdfCardProps) {
  const [internalDownloading, setInternalDownloading] = useState(false);
  const downloading = isDownloading || internalDownloading;

  const handleDownload = async () => {
    if (downloading) return;

    if (onDownload) {
      onDownload(attachment);
      return;
    }

    if (attachment.url) {
      try {
        setInternalDownloading(true);
        const link = document.createElement("a");
        link.href = attachment.url;
        link.download = attachment.fileName || "documento.pdf";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } finally {
        setInternalDownloading(false);
      }
    }
  };

  const formattedSize = formatFileSize(attachment.fileSize || 0);

  return (
    <div
      data-testid="chat-pdf-card"
      className={cn(
        "flex w-full max-w-xs min-w-0 items-center gap-3 rounded-lg border p-2.5 transition-colors sm:max-w-sm sm:p-3",
        isOwn
          ? "border-surface/20 bg-surface/10 text-surface"
          : "border-border bg-surface-soft text-ink"
      )}
    >
      <div
        data-testid="pdf-card-icon-container"
        className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg border border-brand-red/30 bg-brand-soft text-brand-red shadow-2xs"
      >
        <FileText className="size-5" aria-hidden="true" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <span
          data-testid="pdf-card-filename"
          className="truncate text-xs font-semibold sm:text-sm"
          title={attachment.fileName}
        >
          {attachment.fileName}
        </span>
        <span
          data-testid="pdf-card-meta"
          className={cn(
            "text-[11px] font-medium tracking-tight",
            isOwn ? "text-surface/80" : "text-text-secondary"
          )}
        >
          PDF · {formattedSize}
        </span>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        data-testid="pdf-download-button"
        aria-label={`Descargar ${attachment.fileName}`}
        title={`Descargar ${attachment.fileName}`}
        disabled={downloading}
        onClick={handleDownload}
        className={cn(
          "size-8 shrink-0 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-ring",
          isOwn
            ? "text-surface hover:bg-surface/20 hover:text-surface"
            : "text-text-secondary hover:bg-surface hover:text-ink"
        )}
      >
        {downloading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="size-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
