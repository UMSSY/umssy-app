import type { Socket } from "socket.io-client";

/** Wait for the server's authorization/join acknowledgement before synchronizing. */
export function joinChatConversation(
  socket: Socket,
  conversationId: string,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      if (error) reject(error);
      else resolve();
    };
    const abort = () => finish(new Error("Reconexión cancelada"));
    const timeout = setTimeout(
      () => finish(new Error("El chat no confirmó la conexión")),
      10000,
    );
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) {
      abort();
      return;
    }
    if (!socket.connected) {
      finish(new Error("El canal no está conectado"));
      return;
    }
    socket.emit(
      "conversation:join",
      { conversationId },
      (result?: {
        ok?: boolean;
        error?: string;
        data?: { ok?: boolean; error?: string };
      }) => {
        const acknowledgement = result?.data ?? result;
        finish(
          acknowledgement?.ok === true
            ? undefined
            : new Error(
                acknowledgement?.error || "No se pudo abrir la conversación",
              ),
        );
      },
    );
  });
}
