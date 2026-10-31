
"use client";

import { ChatWorkspace } from "../components/chat-workspace";
import { useSocket } from "../contexts/socket-context";
import { WifiOff } from "lucide-react";

export function ChatView() {
  const { isConnected} = useSocket();

  return (
    <div className="relative flex size-full flex-col">
      {!isConnected && (
        <div className="flex items-center justify-center gap-2 bg-destructive/15 px-4 py-2 text-sm text-destructive">
          <WifiOff className="size-4" />
          <span>Desconectado. Reconectando...</span>
        </div>
      )}
      
      <ChatWorkspace />
    </div>
  );
}