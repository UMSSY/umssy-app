"use client";

import { useEffect, useRef } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import {
  formatEventRoomTime,
  formatMessageDateSeparator,
  getInitials,
} from "../utils/date-formatter";
import type { EventRoomParticipant } from "../types/event-room.types";
import type { EventRoomMessagesProps } from "../types/event-room-messages-props.types";
import { EventRoomEmptyState } from "./event-room-empty-state";

/**
 * Devuelve el nombre visible del remitente.
 * Si el senderId no está en la lista de participantes, usa "Participante" como respaldo.
 */
function getSenderName(
  senderId: string,
  participants: EventRoomParticipant[],
): string {
  const participant = participants.find((item) => item.id === senderId);
  return participant?.fullName ?? "Participante";
}

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
      {messages.map((message, index) => {
        const isOwn = message.senderId === currentUserId;
        const messageDate = message.timestamp || message.createdAt || "";
        const senderName = getSenderName(message.senderId, participants);
        const showDateSeparator = index === 0;

        return (
          <div
            key={message.id}
            data-message-id={message.id}
            className="w-full"
          >
            {showDateSeparator && (
              <div className="my-4 flex items-center justify-center">
                <span
                  className="text-center text-xs font-semibold whitespace-nowrap text-text-secondary"
                >
                  {formatMessageDateSeparator(messageDate)}
                </span>
              </div>
            )}

            <div
              className={cn(
                "flex w-full min-w-0",
                isOwn ? "justify-end" : "justify-start",
              )}
            >
              {!isOwn && (
                <>
                  <div className="shrink-0">
                    <Avatar size="default" className="border border-border bg-surface">
                      <AvatarFallback className="text-xs font-bold text-ink">
                        {getInitials(senderName)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="mt-0.5 text-xs font-medium text-text-secondary">
                      {senderName}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink shadow-xs md:max-w-[85%]",
                      )}
                    >
                      {message.content}
                    </div>
                    <div className="mt-1.5 flex justify-end text-[10px]">
                      <span className="text-text-secondary">
                        {formatEventRoomTime(messageDate)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {isOwn && (
                <div className="min-w-0">
                  <div
                    className={cn(
                      "rounded-2xl bg-accent px-3.5 py-2.5 text-sm text-surface shadow-xs md:max-w-[85%]",
                    )}
                  >
                    {message.content}
                  </div>
                  <div className="mt-1.5 flex justify-end text-[10px]">
                    <span className="text-surface/80">
                      {formatEventRoomTime(messageDate)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div data-testid="messages-scroll-anchor" />
    </div>
  );
}
