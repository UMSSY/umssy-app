
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { sendMessage } from "../services/chat-api";
import { messagesQueryKey } from "../constants/messages-query-key";
import type { Message } from "../types/conversation.types";

export function useSendEventRoomMessage(conversationId: string | null) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (content: string): Promise<Message> => {
      if (!conversationId) {
        throw new Error("No hay una conversación seleccionada.");
      }

      const response = await sendMessage({
        conversationId,
        content,
      });

      const message = response?.data;
      if (!message || !message.id) {
        throw new Error("No se pudo enviar el mensaje.");
      }

      return message;
    },
    onSuccess: () => {
      if (conversationId) {
        void queryClient.invalidateQueries({
          queryKey: messagesQueryKey(conversationId),
        });
      }
    },
    onError: (error) => {
      toast.error("No se pudo enviar el mensaje", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    },
  });

  const send = async (content: string): Promise<Message | null> => {
    if (!conversationId) return null;
    try {
      return await mutation.mutateAsync(content);
    } catch {
      return null;
    }
  };

  return {
    send,
    isSending: mutation.isPending,
    sendError: mutation.error instanceof Error ? mutation.error.message : null,
    clearError: mutation.reset,
  };
}