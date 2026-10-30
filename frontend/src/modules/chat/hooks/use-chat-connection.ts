"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getChatSocket } from "../components/chat-socket";
import { joinChatConversation } from "../services/join-chat-conversation";
import { synchronizeMessages } from "../services/synchronize-messages";
import type { ChatConnectionStatus } from "../types/chat-connection-status.types";

/** Reuse the epic's socket; recovery completes only after join + HTTP catch-up. */
export function useChatConnection(conversationId: string | null) {
  const client = useQueryClient();
  const refreshRef = useRef<(id?: string) => void>(() => undefined);
  const refreshMessages = useCallback(
    (id?: string) => refreshRef.current(id),
    [],
  );
  const [connection, setConnection] = useState<{
    conversationId: string | null;
    status: ChatConnectionStatus;
  }>({ conversationId: null, status: "reconnecting" });

  useEffect(() => {
    if (!conversationId) return;
    let disposed = false;
    let socket: ReturnType<typeof getChatSocket> | undefined;
    let attempt: AbortController | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    let joined = false;
    let syncing = false;
    let dirty = false;
    const update = (status: ChatConnectionStatus) => {
      if (!disposed) setConnection({ conversationId, status });
    };
    const cancel = () => {
      clearTimeout(retry);
      attempt?.abort();
      joined = false;
      syncing = false;
    };
    const scheduleRetry = () => {
      clearTimeout(retry);
      if (!disposed && navigator.onLine) {
        retry = setTimeout(connect, Math.min(1000 * 2 ** failures++, 15000));
      }
    };
    const drain = async (current: AbortController) => {
      if (syncing || !joined) return;
      syncing = true;
      try {
        do {
          dirty = false;
          await synchronizeMessages(client, conversationId, current.signal);
          current.signal.throwIfAborted();
          if (!navigator.onLine || !socket?.connected)
            throw new Error("Canal desconectado");
        } while (dirty);
        failures = 0;
        update("connected");
        void client.invalidateQueries({ queryKey: ["chat", "conversations"] });
      } catch {
        if (disposed || current.signal.aborted) return;
        joined = false;
        update(navigator.onLine ? "reconnecting" : "offline");
        scheduleRetry();
      } finally {
        if (attempt === current) syncing = false;
      }
    };
    const recover = async () => {
      cancel();
      if (!navigator.onLine) {
        update("offline");
        return;
      }
      const current = new AbortController();
      attempt = current;
      update("reconnecting");
      try {
        await joinChatConversation(socket!, conversationId, current.signal);
        current.signal.throwIfAborted();
        joined = true;
        await drain(current);
      } catch {
        if (disposed || current.signal.aborted) return;
        update(navigator.onLine ? "reconnecting" : "offline");
        scheduleRetry();
      }
    };
    const disconnected = () => {
      cancel();
      update(navigator.onLine ? "reconnecting" : "offline");
      scheduleRetry();
    };
    const onConnect = () => {
      void recover();
    };
    const onMessage = (message: { conversationId?: string }) => {
      if (!message?.conversationId) return;
      void client.invalidateQueries({ queryKey: ["chat", "conversations"] });
      if (message.conversationId !== conversationId) return;
      dirty = true;
      if (joined && attempt) void drain(attempt);
    };
    function connect() {
      if (disposed) return;
      if (!navigator.onLine) {
        disconnected();
        return;
      }
      update("reconnecting");
      try {
        const next = getChatSocket();
        if (socket !== next) {
          socket?.off("connect", onConnect);
          socket?.off("disconnect", disconnected);
          socket?.off("connect_error", disconnected);
          socket?.off("message:new", onMessage);
          socket = next;
          socket.on("connect", onConnect);
          socket.on("disconnect", disconnected);
          socket.on("connect_error", disconnected);
          socket.on("message:new", onMessage);
        }
        if (socket.connected) void recover();
      } catch {
        scheduleRetry();
      }
    }
    refreshRef.current = (id) => {
      if (id && id !== conversationId) return;
      dirty = true;
      if (joined && attempt) void drain(attempt);
    };
    window.addEventListener("offline", disconnected);
    window.addEventListener("online", connect);
    connect();
    return () => {
      disposed = true;
      cancel();
      refreshRef.current = () => undefined;
      socket?.off("connect", onConnect);
      socket?.off("disconnect", disconnected);
      socket?.off("connect_error", disconnected);
      socket?.off("message:new", onMessage);
      window.removeEventListener("offline", disconnected);
      window.removeEventListener("online", connect);
    };
  }, [client, conversationId]);

  return {
    status:
      connection.conversationId === conversationId
        ? connection.status
        : ("reconnecting" as ChatConnectionStatus),
    refreshMessages,
  };
}
