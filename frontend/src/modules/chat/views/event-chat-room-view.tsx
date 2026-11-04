"use client";

import { useEffect, useMemo, useState } from "react";

import { useEventRoom } from "../hooks/use-event-room";
import { useChatConnection } from "../hooks/use-chat-connection";
import { useMessages } from "../hooks/use-messages";
import { useSendEventRoomMessage } from "../hooks/use-event-room-message";
import { getCurrentSessionUserId } from "../services/chat-api";
import { cn } from "@/lib/utils";
import type { EventChatRoomViewProps } from "../types/event-chat-room-view-props.types";

import { EventRoomHeader } from "../components/event-room-header";
import { EventRoomMessages } from "../components/event-room-messages";
import { EventRoomInfoPanel } from "../components/event-room-info-panel";
import { MessageInputBar } from "../components/message-input-bar";

/**
 * Vista de la sala de evento (HU-10).
 *
 * La sala reutiliza la conexión del chat para unirse a la conversación por
 * conversation_participants y recibir message:new sin recargar la página.
 */
export function EventChatRoomView({
  registrationId,
}: EventChatRoomViewProps) {
  const {
    conversationId,
    isJoined,
    error,
    room,
    joinEventRoom,
    leaveEventRoom,
  } = useEventRoom();
  const currentUserId = getCurrentSessionUserId();

  const [inputValue, setInputValue] = useState("");

  const { data: messages = [], isError: isMessagesError } = useMessages(
    conversationId,
  );

  useChatConnection(conversationId);

  const { send: sendMessage, isSending, sendError, clearError } =
    useSendEventRoomMessage(conversationId);

  const participants = useMemo(() => room?.participants ?? [], [room]);
  const participantCount = participants.length;
  const isEmpty = participantCount <= 1 && messages.length === 0;

  // Únase a la sala con el registrationId del contrato Epic 8.
  useEffect(() => {
    if (registrationId && !isJoined && !error) {
      joinEventRoom(registrationId);
    }
  }, [registrationId, isJoined, error, joinEventRoom]);

  useEffect(() => {
    if (!registrationId) {
      leaveEventRoom();
    }
  }, [registrationId, leaveEventRoom]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isSending) return;

    clearError();
    const message = await sendMessage(trimmed);
    if (message) {
      setInputValue("");
    }
  };

  // Error de sala: no se puede abrir.
  if (error) {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center p-6 text-center",
        )}
      >
        {error === "not_registered" ? (
          <>
            <p className="text-sm font-medium text-ink">No registrado</p>
            <p className="mt-1 text-xs text-text-secondary">
              No tienes una inscripción confirmada para este evento.
            </p>
          </>
        ) : (
          <p className="text-sm text-destructive">
            No se pudo abrir la sala
          </p>
        )}
      </div>
    );
  }

  // Cargando / uniéndose.
  if (!isJoined || !conversationId || !room) {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center p-6 text-center",
        )}
      >
        <p className="text-sm text-text-secondary">
          Uniéndose al evento…
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col")}>
      {/* Cabecera central: nombre del grupo, N participantes. */}
      <header className={cn("shrink-0 border-b border-border bg-surface px-4 py-3")}>
        <EventRoomHeader
          groupName={room.name}
          participantCount={participantCount}
        />
      </header>

      <main className={cn("flex min-w-0 flex-1 overflow-hidden lg:flex-row")}>
        {/* Columna central: zona de mensajes + barra de entrada. */}
        <section
          data-testid="event-room-conversation"
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col bg-surface-soft",
          )}
        >
          <EventRoomMessages
            messages={messages}
            currentUserId={currentUserId}
            participants={participants}
            isError={isMessagesError}
            isEmpty={isEmpty}
          />

          {sendError && (
            <div
              role="alert"
              className="shrink-0 border-t border-border bg-destructive/10 px-4 py-2"
            >
              <p className="text-sm text-destructive">{sendError}</p>
            </div>
          )}

          <MessageInputBar
            value={inputValue}
            onChange={(value) => {
              setInputValue(value);
              if (sendError) clearError();
            }}
            onSend={() => void handleSend()}
            placeholder="Escribe un mensaje al grupo..."
            isSending={isSending}
            sendDisabled={!conversationId}
          />
        </section>

        {/* Columna derecha: Info del grupo (solo pantallas grandes). */}
        <aside className={cn("hidden flex-col border-l border-border bg-surface p-4 lg:flex lg:w-80")}>
          <EventRoomInfoPanel
            groupName={room.name}
            createdAt={room.createdAt}
            participants={participants}
            currentUserId={currentUserId}
          />
        </aside>
      </main>
    </div>
  );
}
