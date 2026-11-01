"use client";

import { useState } from "react";
import { RefreshCw, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatConnectionStatus } from "../types/chat-connection-status.types";

export function ChatConnectionBanner({
  status,
}: {
  status: Exclude<ChatConnectionStatus, "connected">;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const offline = status === "offline";
  const Icon = offline ? WifiOff : RefreshCw;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`mx-4 mt-3 flex shrink-0 items-center gap-3 rounded-lg p-3 text-sm md:mx-6 ${offline ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200" : "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200"}`}
    >
      <Icon
        aria-hidden="true"
        className={`size-5 shrink-0 ${offline ? "" : "motion-safe:animate-spin"}`}
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {offline
            ? "Sin conexión a internet"
            : "Reconectando y sincronizando mensajes..."}
        </p>
        <p className="mt-1 text-xs">
          {offline
            ? "Intentaremos reconectar al recuperar internet."
            : "Esto puede tardar unos segundos."}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Cerrar aviso de conexión"
        onClick={() => setDismissed(true)}
      >
        <X aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}
