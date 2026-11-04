"use client";

import { Users } from "lucide-react";

import { cn } from "@/lib/utils";

import type { EventRoomEmptyStateProps } from "../types/event-room-empty-state-props.types";

/**
 * Estado vacío de la sala: 1 participante y 0 mensajes.
 */
export function EventRoomEmptyState({
  description,
}: EventRoomEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 text-center")}>
      <div
        className="flex size-12 items-center justify-center rounded-full border border-accent bg-accent text-surface"
        aria-hidden="true"
      >
        <Users className="size-6" />
      </div>
      <p className="text-sm font-medium text-ink">{description}</p>
    </div>
  );
}
