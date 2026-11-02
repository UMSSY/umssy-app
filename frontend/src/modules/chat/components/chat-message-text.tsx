"use client";

import { useMemo } from "react";
import type { ChatMessageTextProps } from "../types/chat-message-text-props.types";
import { parseMessageWithLinks } from "../utils/link-parser";
import { cn } from "@/lib/utils";

export function ChatMessageText({
  content,
  isOwn = false,
  className,
}: ChatMessageTextProps) {
  const segments = useMemo(() => parseMessageWithLinks(content), [content]);

  return (
    <span
      data-testid="chat-message-text"
      className={cn(
        "leading-relaxed [overflow-wrap:anywhere] break-words whitespace-pre-wrap",
        className
      )}
    >
      {segments.map((segment, index) => {
        if (segment.type === "link" && segment.url) {
          return (
            <a
              key={`link-${index}-${segment.url}`}
              href={segment.url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="chat-clickable-link"
              title={segment.url}
              className={cn(
                "font-medium [overflow-wrap:anywhere] break-all underline underline-offset-2 transition-opacity",
                isOwn
                  ? "text-surface hover:opacity-90"
                  : "text-accent hover:opacity-80"
              )}
            >
              {segment.content}
            </a>
          );
        }

        return <span key={`text-${index}`}>{segment.content}</span>;
      })}
    </span>
  );
}

