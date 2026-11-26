"use client";

import Image from "next/image";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CHAT_MESSAGE_TOAST_LOGO_SRC,
  CHAT_MESSAGE_TOAST_TEXT,
} from "../constants/chat-message-toast.constants";
import type { ChatMessageToastProps } from "../types/chat-message-toast-props.types";

export function ChatMessageToast({
  title,
  preview,
  siteLabel,
  actionLabel,
  onOpen,
  onClose,
}: ChatMessageToastProps) {
  return (
    <article
      aria-label={`${CHAT_MESSAGE_TOAST_TEXT.subtitle}: ${title}`}
      className="w-full rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-xs sm:w-sm"
    >
      <header className="flex items-center gap-2">
        <Image
          src={CHAT_MESSAGE_TOAST_LOGO_SRC}
          alt=""
          width={16}
          height={16}
          unoptimized
          className="size-4 shrink-0"
        />
        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          <span className="font-semibold text-ink">{CHAT_MESSAGE_TOAST_TEXT.brand}</span>
          {siteLabel ? ` · ${siteLabel}` : null}
        </p>
        <span className="text-xs text-muted-foreground">{CHAT_MESSAGE_TOAST_TEXT.time}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={CHAT_MESSAGE_TOAST_TEXT.close}
          onClick={onClose}
          className="text-muted-foreground"
        >
          <X aria-hidden="true" />
        </Button>
      </header>

      <div className="mt-2 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-interaction text-primary">
          <MessageCircle aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{title}</p>
          <p className="line-clamp-2 text-sm text-ink-soft">{preview}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{CHAT_MESSAGE_TOAST_TEXT.subtitle}</p>
        </div>
      </div>

      {onOpen ? (
        <div className="mt-3 flex justify-end">
          <Button type="button" size="sm" onClick={onOpen}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </article>
  );
}