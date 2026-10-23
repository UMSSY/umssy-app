'use client';

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useEffect } from 'react';
import {
  countCharacters,
  truncateToMaxCharacters,
  isWhitespaceOnly,
  MAX_MESSAGE_LENGTH,
} from '../utils/unicode-counter';

interface MessageInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isSending?: boolean;
  maxLength?: number;
  placeholder?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function MessageInputBar({
  value,
  onChange,
  onSend,
  disabled = false,
  isSending = false,
  maxLength = MAX_MESSAGE_LENGTH,
  placeholder = 'Escribe un mensaje...',
  onKeyDown,
}: MessageInputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-ajuste de altura del textarea segun el contenido (maximo 120px)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${Math.max(newHeight, 40)}px`;
  }, [value]);

  const characterCount = countCharacters(value);
  const isSendDisabled =
    disabled || isSending || isWhitespaceOnly(value) || characterCount > maxLength;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    const truncatedValue = truncateToMaxCharacters(rawValue, maxLength);
    onChange(truncatedValue);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isSendDisabled) {
      onSend();
    }
  };

  return (
    <div
      data-testid="message-input-bar"
      className="w-full min-w-0 shrink-0 border-t border-border bg-surface p-3 transition-all md:p-4"
    >
      <form onSubmit={handleSubmit} className="flex w-full min-w-0 flex-col gap-2">
        <div className="flex w-full min-w-0 items-end gap-2.5 rounded-xl border border-border bg-surface-soft p-2 transition-all focus-within:border-ink focus-within:bg-surface">
          <Textarea
            ref={textareaRef}
            data-testid="message-textarea"
            value={value}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            disabled={disabled || isSending}
            placeholder={placeholder}
            rows={1}
            className="max-h-[120px] min-h-[40px] w-full min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent p-1 text-sm leading-relaxed [overflow-wrap:anywhere] break-words text-ink placeholder:text-text-secondary focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Campo de redaccion de mensaje"
          />

          <div className="flex shrink-0 items-center gap-2 pb-1">
            <span
              data-testid="character-counter"
              className={`text-xs font-medium tracking-tight select-none ${
                characterCount >= maxLength
                  ? 'font-bold text-accent'
                  : 'text-text-secondary'
              }`}
            >
              {characterCount}/{maxLength}
            </span>

            <Button variant="ghost"
              type="submit"
              data-testid="send-button"
              disabled={isSendDisabled}
              aria-label="Enviar mensaje"
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold text-surface shadow-xs transition-all focus-visible:ring-2 focus-visible:ring-ring md:text-sm ${
                isSendDisabled
                  ? 'cursor-not-allowed bg-border-strong text-text-secondary opacity-60 shadow-none'
                  : 'bg-primary text-primary-foreground shadow-none hover:bg-brand-hover'
              }`}
            >
              {isSending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

