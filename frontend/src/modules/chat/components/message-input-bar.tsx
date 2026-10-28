"use client";

import { useRef, useEffect, useState } from "react";
import type {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
} from "react";
import { Paperclip, FileText, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  countCharacters,
  truncateToMaxCharacters,
  isWhitespaceOnly,
  MAX_MESSAGE_LENGTH,
} from "../utils/unicode-counter";
import {
  validateAttachmentFile,
  formatFileSize,
  isAllowedImage,
} from "../utils/attachment-validator";
import { ACCEPTED_ATTACHMENT_TYPES } from "../constants/attachment.constants";

export interface MessageInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isSending?: boolean;
  maxLength?: number;
  placeholder?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  attachment?: File | null;
  onAttachmentChange?: (file: File | null) => void;
  isUploading?: boolean;
}

export function MessageInputBar({
  value,
  onChange,
  onSend,
  disabled = false,
  isSending = false,
  maxLength = MAX_MESSAGE_LENGTH,
  placeholder = "Escribe un mensaje...",
  onKeyDown,
  attachment,
  onAttachmentChange,
  isUploading = false,
}: MessageInputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Soporte de estado controlado o no controlado para el adjunto
  const [internalAttachment, setInternalAttachment] = useState<File | null>(null);
  const currentAttachment =
    attachment !== undefined ? attachment : internalAttachment;

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const setAttachment = (file: File | null) => {
    if (onAttachmentChange) {
      onAttachmentChange(file);
    } else {
      setInternalAttachment(file);
    }
  };

  // Limpieza de URL en desmontaje
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Ajusta la altura del textarea hasta un máximo de 120px.
  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";

    const newHeight = Math.min(textarea.scrollHeight, 120);

    textarea.style.height = `${Math.max(newHeight, 40)}px`;
  }, [value]);

  const characterCount = countCharacters(value);
  const hasText = !isWhitespaceOnly(value);
  const hasAttachment = Boolean(currentAttachment);
  const canSend = hasText || hasAttachment;

  const isSendDisabled =
    disabled ||
    isSending ||
    isUploading ||
    !canSend ||
    characterCount > maxLength;

  const handleChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    const rawValue = event.target.value;

    const truncatedValue = truncateToMaxCharacters(
      rawValue,
      maxLength
    );

    onChange(truncatedValue);
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = validateAttachmentFile(file);
    if (!result.valid) {
      toast.error(result.error);
      event.target.value = "";
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    if (isAllowedImage(file)) {
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setImagePreviewUrl(null);
    }

    setAttachment(file);
    event.target.value = "";
  };

  const handleRemoveAttachment = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setAttachment(null);
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!isSendDisabled) {
      onSend();
    }
  };

  const isImageAttachment = currentAttachment
    ? isAllowedImage(currentAttachment)
    : false;

  return (
    <div
      data-testid="message-input-bar"
      className="w-full min-w-0 shrink-0 border-t border-border bg-surface p-3 transition-all md:p-4"
    >
      <form
        onSubmit={handleSubmit}
        className="flex w-full min-w-0 flex-col gap-2"
      >
        {/* Píldora / tarjeta de archivo adjunto seleccionado */}
        {currentAttachment && (
          <div
            data-testid="attachment-preview"
            className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-soft p-2 text-xs shadow-xs"
          >
            {isImageAttachment && imagePreviewUrl ? (
              <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreviewUrl}
                  alt={currentAttachment.name}
                  className="size-full object-cover"
                />
              </div>
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-accent">
                <FileText className="size-5" />
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
              <span
                data-testid="attachment-name"
                className="truncate font-medium text-ink"
                title={currentAttachment.name}
              >
                {currentAttachment.name}
              </span>
              <span
                data-testid="attachment-size"
                className="text-[11px] text-text-secondary"
              >
                {isImageAttachment ? "Imagen" : "PDF"} · {formatFileSize(currentAttachment.size)}
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-testid="remove-attachment-button"
              aria-label="Quitar archivo adjunto"
              disabled={disabled || isSending || isUploading}
              onClick={handleRemoveAttachment}
              className="size-6 shrink-0 rounded-full text-text-secondary hover:bg-surface-soft hover:text-ink"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )}

        {/* Input file de Shadcn/Base UI (oculto visualmente) */}
        <Input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_ATTACHMENT_TYPES}
          data-testid="file-input"
          onChange={handleFileSelect}
          disabled={disabled || isSending || isUploading}
        />

        <div className="flex w-full min-w-0 items-end gap-2.5 rounded-xl border border-border bg-surface-soft p-2 transition-all focus-within:border-ink focus-within:bg-surface">
          {/* Botón clip para adjuntar archivo */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-testid="attach-file-button"
            aria-label="Adjuntar archivo"
            disabled={disabled || isSending || isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="size-9 shrink-0 rounded-lg text-text-secondary hover:bg-surface-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Paperclip className="size-4" />
          </Button>

          <Textarea
            ref={textareaRef}
            data-testid="message-textarea"
            value={value}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            disabled={disabled || isSending || isUploading}
            placeholder={placeholder}
            rows={1}
            className="max-h-[120px] min-h-[40px] w-full min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent p-1 text-sm leading-relaxed [overflow-wrap:anywhere] break-words text-ink placeholder:text-text-secondary focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Campo de redacción de mensaje"
          />

          <div className="flex shrink-0 items-center gap-2 pb-1">
            <span
              data-testid="character-counter"
              className={`text-xs font-medium tracking-tight select-none ${
                characterCount >= maxLength
                  ? "font-bold text-accent"
                  : "text-text-secondary"
              }`}
            >
              {characterCount}/{maxLength}
            </span>

            <Button
              type="submit"
              variant="default"
              size="default"
              data-testid="send-button"
              disabled={isSendDisabled}
              aria-label="Enviar mensaje"
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold shadow-xs transition-all focus-visible:ring-2 focus-visible:ring-ring md:text-sm ${
                isSendDisabled
                  ? "cursor-not-allowed bg-border-strong text-text-secondary opacity-60 shadow-none"
                  : "bg-primary text-primary-foreground shadow-none hover:bg-brand-hover"
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Subiendo...</span>
                </>
              ) : isSending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                "Enviar"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
