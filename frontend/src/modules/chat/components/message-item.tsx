"use client";

import { useMemo } from "react";
import type { MessageItemProps } from "../types/message-item-props.types";
import type { MessageAttachment } from "../types/attachment.types";
import type { LinkPreviewData } from "../types/link-preview.types";
import { ChatImageThumbnail } from "./chat-image-thumbnail";
import { ChatPdfCard } from "./chat-pdf-card";
import { ChatMessageText } from "./chat-message-text";
import { ChatLinkPreviewCard } from "./chat-link-preview-card";
import { formatMessageDateSeparator } from "../utils/date-formatter";
import { extractFirstValidUrl, extractDomainFromUrl } from "../utils/link-parser";
import { useLinkPreview } from "../hooks/use-link-preview";
import { cn } from "@/lib/utils";

function getMessageDate(message: MessageItemProps["message"]): string {
  return message.timestamp || message.createdAt || "";
}

function formatMessageTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const hour = String(hours % 12 || 12).padStart(2, "0");
  return `${hour}:${minutes} ${hours >= 12 ? "PM" : "AM"}`;
}

export function MessageItem({
  message,
  isOwn,
  showDateSeparator = false,
  onDownloadAttachment,
  onImageClick,
}: MessageItemProps) {
  const messageDate = getMessageDate(message);

  const resolvedAttachment: MessageAttachment | null = useMemo(() => {
    if (message.attachment) {
      return message.attachment;
    }

    if (message.attachments && message.attachments.length > 0) {
      return message.attachments[0];
    }

    // Compatibilidad con adjuntos sintéticos o históricos
    if (message.isAttachment) {
      const isImage = message.attachmentType === "image";
      const cleanedName = message.content.replace(/^\[Archivo\]\s*/i, "");
      return {
        id: message.id,
        fileName: cleanedName || (isImage ? "imagen.png" : "documento.pdf"),
        mimeType: isImage ? "image/png" : "application/pdf",
        fileSize: 245 * 1024,
        url: `/api/chat/attachments/${message.id}/download`,
        type: isImage ? "IMAGE" : "PDF",
      };
    }

    return null;
  }, [message]);

  const isImageAttachment = useMemo(() => {
    if (!resolvedAttachment) return false;
    const typeUpper = (resolvedAttachment.type || "").toUpperCase();
    return (
      typeUpper === "IMAGE" ||
      message.attachmentType === "image" ||
      resolvedAttachment.mimeType.startsWith("image/")
    );
  }, [resolvedAttachment, message.attachmentType]);

  const isPdfAttachment = useMemo(() => {
    if (!resolvedAttachment) return false;
    const typeUpper = (resolvedAttachment.type || "").toUpperCase();
    return (
      typeUpper === "PDF" ||
      message.attachmentType === "file" ||
      resolvedAttachment.mimeType === "application/pdf" ||
      resolvedAttachment.fileName.toLowerCase().endsWith(".pdf")
    );
  }, [resolvedAttachment, message.attachmentType]);

  // Si hay un adjunto y el contenido es igual al nombre del archivo o es el prefijo [Archivo], no duplicar como texto
  const shouldShowTextContent = useMemo(() => {
    if (!message.content) return false;
    const trimmed = message.content.trim();
    if (!trimmed) return false;

    if (resolvedAttachment) {
      if (trimmed === resolvedAttachment.fileName) return false;
      if (trimmed.startsWith("[Archivo]")) return false;
    }

    return true;
  }, [message.content, resolvedAttachment]);

  const firstUrl = useMemo(() => {
    return extractFirstValidUrl(message.content);
  }, [message.content]);

  const { preview: fetchedPreview } = useLinkPreview(firstUrl);

  const linkAttachmentPreview = useMemo<LinkPreviewData | null>(() => {
    if (resolvedAttachment && resolvedAttachment.type?.toUpperCase() === "LINK") {
      return {
        url: resolvedAttachment.url,
        domain: extractDomainFromUrl(resolvedAttachment.url),
        title: resolvedAttachment.fileName || null,
        description: null,
        imageUrl: resolvedAttachment.thumbnailUrl || null,
        hasPreview: true,
      };
    }
    return null;
  }, [resolvedAttachment]);

  const activePreview = linkAttachmentPreview || fetchedPreview;

  return (
    <div data-testid={`message-item-wrapper-${message.id}`} className="w-full">
      {showDateSeparator && (
        <div
          data-testid={`date-separator-${message.id}`}
          className="my-5 flex items-center gap-3"
        >
          <div className="h-px flex-1 bg-border" />
          <span className="text-center text-xs font-semibold whitespace-nowrap text-text-secondary">
            {formatMessageDateSeparator(messageDate)}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      <div
        data-testid={`message-item-${message.id}`}
        className={cn(
          "flex w-full min-w-0",
          isOwn ? "justify-end" : "justify-start"
        )}
      >
        <div
          className={cn(
            "min-w-0 rounded-2xl px-3.5 py-2.5 text-sm [overflow-wrap:anywhere] break-words shadow-xs md:max-w-[70%]",
            resolvedAttachment ? "max-w-[90%]" : "max-w-[85%]",
            isOwn
              ? "rounded-tr-xs bg-accent text-surface"
              : "rounded-tl-xs border border-border bg-surface text-ink"
          )}
        >
          {isImageAttachment && resolvedAttachment && (
            <ChatImageThumbnail
              attachment={resolvedAttachment}
              caption={shouldShowTextContent ? message.content : null}
              isOwn={isOwn}
              onImageClick={onImageClick}
            />
          )}

          {isPdfAttachment && resolvedAttachment && (
            <div className="flex flex-col gap-2">
              <ChatPdfCard
                attachment={resolvedAttachment}
                isOwn={isOwn}
                onDownload={onDownloadAttachment}
              />
              {shouldShowTextContent && (
                <div data-testid="pdf-caption" className="px-0.5">
                  <ChatMessageText
                    content={message.content.trim()}
                    isOwn={isOwn}
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {!isImageAttachment && !isPdfAttachment && (
            <div className="flex flex-col">
              <ChatMessageText
                content={message.content}
                isOwn={isOwn}
              />
              {activePreview && (
                <ChatLinkPreviewCard
                  preview={activePreview}
                  isOwn={isOwn}
                />
              )}
            </div>
          )}

          {/* Hora y estado de entrega */}
          <div
            className={cn(
              "mt-1.5 flex items-center justify-end gap-1.5 text-[10px]",
              isOwn ? "text-surface/80" : "text-text-secondary"
            )}
          >
            <span>{formatMessageTime(messageDate)}</span>
            {isOwn && (
              <span className="font-medium">
                {message.status === "sending"
                  ? "Enviando..."
                  : message.status === "error"
                  ? "Error"
                  : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

