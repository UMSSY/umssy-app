"use client";

import { useState } from "react";
import Image from "next/image";
import { Globe, ExternalLink } from "lucide-react";
import type { ChatLinkPreviewCardProps } from "../types/chat-link-preview-card-props.types";
import { cn } from "@/lib/utils";

export function ChatLinkPreviewCard({
  preview,
  isOwn = false,
  className,
}: ChatLinkPreviewCardProps) {
  const [imageError, setImageError] = useState(false);

  if (!preview || !preview.hasPreview) {
    return null;
  }

  const hasTitle = Boolean(preview.title && preview.title.trim().length > 0);
  const hasDomain = Boolean(preview.domain && preview.domain.trim().length > 0);

  if (!hasTitle && !hasDomain) {
    return null;
  }

  const displayTitle = preview.title || preview.domain || preview.url;
  const showImage = Boolean(preview.imageUrl && !imageError);

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="chat-link-preview-card"
      aria-label={`Abrir enlace: ${displayTitle}`}
      className={cn(
        "group mt-2 block w-full max-w-sm overflow-hidden rounded-xl border text-left no-underline transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-hidden",
        isOwn
          ? "border-surface/20 bg-surface/10 text-surface hover:bg-surface/20"
          : "border-border bg-surface-soft text-ink hover:bg-surface hover:shadow-xs",
        className
      )}
    >
      {showImage && preview.imageUrl && (
        <div
          data-testid="link-preview-image-container"
          className="relative aspect-video max-h-40 w-full overflow-hidden bg-black/5"
        >
          <Image
            src={preview.imageUrl}
            alt={displayTitle}
            width={400}
            height={200}
            unoptimized
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      <div className="flex flex-col gap-1 p-3">
        {hasDomain && (
          <div
            data-testid="link-preview-domain"
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase",
              isOwn ? "text-surface/75" : "text-text-secondary"
            )}
          >
            <Globe className="size-3 shrink-0 opacity-80" aria-hidden="true" />
            <span className="truncate">{preview.domain}</span>
            <ExternalLink
              className="size-3 shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          </div>
        )}

        <h4
          data-testid="link-preview-title"
          className={cn(
            "line-clamp-2 text-xs leading-snug font-semibold sm:text-sm",
            isOwn ? "text-surface" : "text-ink"
          )}
        >
          {displayTitle}
        </h4>

        {preview.description && (
          <p
            data-testid="link-preview-description"
            className={cn(
              "line-clamp-2 text-[11px] leading-relaxed sm:text-xs",
              isOwn ? "text-surface/85" : "text-text-secondary"
            )}
          >
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
}

