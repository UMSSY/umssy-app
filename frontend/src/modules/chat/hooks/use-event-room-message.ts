"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { sendMessage } from "../services/chat-api";
import { messagesQueryKey } from "../constants/messages-query-key";
import type { Message } from "../types/conversation.types";

/**
 * Hook para enviar mensajes en la sala de evento.
 *
 * Notas del comportamiento (ajuste HU-10):
 * - El campo se limpia tras un envío exitoso (la view limpia el input cuando `send` retorna un mensaje).
 * - El aviso de error solo aparece si la petición realmente falla.
 * - No se modifica ChatRoom.
 */
export function useSendEventRoomMessage(conversationId: string | null) {
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const send = useCallback(
    async (content: string): Promise<Message | null> => {
      if (!conversationId) return null;

      setIsSending(true);
      setSendError(null);

      try {
        const response = await sendMessage({
          conversationId,
          content,
        });

        const message = response?.data;
        if (!message || !message.id) {
          throw new Error("No se pudo enviar el mensaje.");
        }

        void queryClient
          .invalidateQueries({ queryKey: messagesQueryKey(conversationId) })
          .catch(() => undefined);

        return message as Message;
      } catch (error) {
        const messageError =
          error instanceof Error ? error.message : "No se pudo enviar el mensaje.";
        setSendError(messageError);
        void toast.error("No se pudo enviar el mensaje", {
          description: "Intenta nuevamente.",
        });
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, queryClient],
  );

  const clearError = useCallback(() => {
    setSendError(null);
  }, []);

  return { send, isSending, sendError, clearError };
}
