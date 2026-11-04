"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import type { EventRoomMessagesProps } from "../types/event-room-messages-props.types";
import { getEventRoomSenderName } from "../utils/get-event-room-sender-name";
import { EventRoomEmptyState } from "./event-room-empty-state";
import { MessageItem } from "./message-item";

export function EventRoomMessages({
  messages,
  currentUserId,
  participants,
  isEmpty = false,
}: EventRoomMessagesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Desplazarse al último mensaje cuando cambien los mensajes.
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Estado vacío: 1 participante y 0 mensajes.
  if (isEmpty) {
    return (
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center",
        )}
      >
        <EventRoomEmptyState
          description="Aún no hay mensajes. Envía el primero para comenzar la conversación."
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-surface-soft p-4 md:p-6",
      )}
    >
      <div className="space-y-3">
        {messages.map((message, index) => {
          const isOwn = message.senderId === currentUserId;

          return (
            <div key={message.id} data-message-id={message.id}>
              <MessageItem
                message={message}
                isOwn={isOwn}
                senderName={
                  isOwn
                    ? undefined
                    : getEventRoomSenderName(message.senderId, participants)
                }
                showDateSeparator={index === 0}
              />
            </div>
          );
        })}
      </div>

      <div data-testid="messages-scroll-anchor" />
    </div>
  );
}
