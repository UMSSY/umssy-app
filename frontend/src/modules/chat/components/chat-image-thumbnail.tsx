"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import type { ChatImageThumbnailProps } from "../types/chat-image-thumbnail-props.types";
import { cn } from "@/lib/utils";
import { apiClient } from "@/shared/services/api-client";

// In-memory cache for loaded blob URLs to avoid re-fetching on chat re-renders
const blobCache = new Map<string, string>();

export function ChatImageThumbnail({
  attachment,
  caption,
  isOwn = false,
  onImageClick,
}: ChatImageThumbnailProps) {
  const rawUrl = attachment.url || attachment.thumbnailUrl || "";
  const altText = attachment.fileName || caption || "Imagen adjunta";

  // Determine if it requires an authenticated backend fetch
  const isBlobOrData = rawUrl.startsWith("blob:") || rawUrl.startsWith("data:");
  const isInternalDownload =
    Boolean(rawUrl) &&
    !isBlobOrData &&
    (rawUrl.includes("/chat/attachments/") ||
      Boolean(attachment.id && rawUrl.startsWith("/")));

  const cacheKey = attachment.id || rawUrl;
  const cachedUrl =
    isInternalDownload && cacheKey ? blobCache.get(cacheKey) ?? null : null;

  const [downloadedBlobUrl, setDownloadedBlobUrl] = useState<string | null>(
    cachedUrl
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    Boolean(isInternalDownload && !cachedUrl)
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isInternalDownload || (cacheKey && blobCache.has(cacheKey))) {
      return;
    }

    let active = true;

    let endpoint = rawUrl;
    if (endpoint.startsWith("http")) {
      try {
        const parsed = new URL(endpoint);
        endpoint = parsed.pathname;
      } catch {
        // use endpoint as is
      }
    }
    if (endpoint.startsWith("/api/")) {
      endpoint = endpoint.replace(/^\/api/, "");
    }
    if (!endpoint.startsWith("/chat/attachments/") && attachment.id) {
      endpoint = `/chat/attachments/${attachment.id}/download`;
    }

    apiClient
      .get(endpoint, { responseType: "blob" })
      .then((response) => {
        if (!active) return;
        const blob = new Blob([response.data as BlobPart], {
          type:
            (response.headers as Record<string, string> | undefined)?.[
              "content-type"
            ] ||
            attachment.mimeType ||
            "image/jpeg",
        });
        const createdUrl =
          typeof window !== "undefined" && window.URL?.createObjectURL
            ? window.URL.createObjectURL(blob)
            : "";
        if (createdUrl && cacheKey) {
          blobCache.set(cacheKey, createdUrl);
        }
        setDownloadedBlobUrl(createdUrl);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setHasError(true);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attachment.id, cacheKey, isInternalDownload, rawUrl, attachment.mimeType]);

  const displayUrl = isInternalDownload
    ? cachedUrl || downloadedBlobUrl || ""
    : rawUrl;

  const handleImageClick = () => {
    if (onImageClick) {
      onImageClick(attachment);
    } else if (displayUrl) {
      window.open(displayUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      data-testid="chat-image-thumbnail"
      className="flex flex-col gap-2 overflow-hidden"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border transition-all",
          isOwn ? "border-surface/20 bg-surface/10" : "border-border bg-surface-soft",
          displayUrl && "cursor-pointer hover:opacity-95"
        )}
        onClick={handleImageClick}
        role={displayUrl ? "button" : undefined}
        tabIndex={displayUrl ? 0 : undefined}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleImageClick();
          }
        }}
        aria-label={`Ver imagen: ${attachment.fileName}`}
      >
        {isLoading ? (
          <div
            data-testid="image-loading"
            className="flex h-44 w-full flex-col items-center justify-center gap-2 p-4 text-center text-text-secondary"
          >
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            <span className="text-xs">Cargando imagen...</span>
          </div>
        ) : hasError || !displayUrl ? (
          <div
            data-testid="image-fallback"
            className="flex h-44 w-full flex-col items-center justify-center gap-2 p-4 text-center"
          >
            <ImageIcon className="size-8 opacity-60" aria-hidden="true" />
            <span className="text-xs font-medium">
              No se pudo cargar la previsualización
            </span>
            <span className="max-w-[200px] truncate text-[11px] opacity-75">
              {attachment.fileName}
            </span>
          </div>
        ) : (
          <div className="relative aspect-auto max-h-72 min-h-36 w-full max-w-xs overflow-hidden sm:max-w-sm">
            <Image
              src={displayUrl}
              alt={altText}
              width={400}
              height={300}
              unoptimized
              className="h-auto max-h-72 w-full object-cover"
              onError={() => setHasError(true)}
            />
          </div>
        )}
      </div>

      {caption && caption.trim().length > 0 && (
        <p
          data-testid="image-caption"
          className={cn(
            "px-0.5 text-sm leading-relaxed [overflow-wrap:anywhere] break-words whitespace-pre-wrap",
            isOwn ? "text-surface" : "text-ink"
          )}
        >
          {caption.trim()}
        </p>
      )}
    </div>
  );
}
