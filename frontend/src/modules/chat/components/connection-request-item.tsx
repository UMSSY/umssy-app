
"use client";

import { Button } from "@/components/ui/button";

import type { ConnectionRequest } from "../types/connection-request.types";
import {
  formatConversationDate,
  getInitials,
} from "../utils/date-formatter";

interface ConnectionRequestItemProps {
  request: ConnectionRequest;
  isSelected: boolean;
  onSelect: (request: ConnectionRequest) => void;
}

export function ConnectionRequestItem({
  request,
  isSelected,
  onSelect,
}: ConnectionRequestItemProps) {
  const sender = request.sender;

  const fullName = sender
    ? `${sender.firstName} ${sender.lastName}`.trim()
    : "Usuario";

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onSelect(request)}
      aria-pressed={isSelected}
      className={`flex h-auto w-full items-center justify-start gap-3 rounded-none border-0 border-b border-border p-3.5 text-left font-normal whitespace-normal transition-all hover:bg-surface-soft ${
        isSelected
          ? "bg-interaction ring-1 ring-border-strong ring-inset"
          : "bg-surface"
      }`}
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border-strong bg-border text-sm font-bold text-ink-soft">
        {getInitials(fullName)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-1">
          <span className="truncate text-sm font-bold text-ink">
            {fullName}
          </span>

          <span className="shrink-0 text-xs font-semibold text-accent">
            {formatConversationDate(request.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-ink">
            Te ha enviado una solicitud de conexión
          </p>

          <span
            className="min-w-4 shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-center text-[10px] font-bold text-surface"
            aria-label="Solicitud pendiente"
          >
            1
          </span>
        </div>
      </div>
    </Button>
  );
}
