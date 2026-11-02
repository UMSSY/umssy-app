"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlockedConversationNoticeProps {
  contactName: string;
  isUnblocking?: boolean;
  onUnblock: () => void;
}

/** Aviso que reemplaza al campo de mensajes mientras el contacto está bloqueado. */
export function BlockedConversationNotice({
  contactName,
  isUnblocking = false,
  onUnblock,
}: BlockedConversationNoticeProps) {
  return (
    <div
      data-testid="blocked-conversation-notice"
      className="flex shrink-0 flex-col items-center gap-3 border-t border-border bg-surface p-4 text-center"
    >
      <div className="flex items-center gap-2 text-ink">
        <Lock className="size-4" aria-hidden="true" />
        <p className="text-sm font-semibold">Has bloqueado a {contactName}.</p>
      </div>
      <p className="text-xs text-text-secondary">
        No puedes enviar ni recibir mensajes de esta persona
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={isUnblocking}
        onClick={onUnblock}
      >
        {isUnblocking ? "Desbloqueando..." : "Desbloquear"}
      </Button>
    </div>
  );
}