"use client";

import { useState } from "react";
import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import type { ChatImageThumbnailProps } from "../types/chat-image-thumbnail-props.types";
import { cn } from "@/lib/utils";

export function ChatImageThumbnail({
  attachment,
  caption,
  isOwn = false,
  onImageClick,
}: ChatImageThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  const imageUrl = attachment.url || attachment.thumbnailUrl || "";
  const altText = attachment.fileName || caption || "Imagen adjunta";

  const handleImageClick = () => {
    if (onImageClick) {
      onImageClick(attachment);
    } else if (imageUrl) {
      window.open(imageUrl, "_blank", "noopener,noreferrer");
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
          imageUrl && "cursor-pointer hover:opacity-95"
        )}
        onClick={handleImageClick}
        role={imageUrl ? "button" : undefined}
        tabIndex={imageUrl ? 0 : undefined}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleImageClick();
          }
        }}
        aria-label={`Ver imagen: ${attachment.fileName}`}
      >
        {hasError || !imageUrl ? (
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
              src={imageUrl}
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
