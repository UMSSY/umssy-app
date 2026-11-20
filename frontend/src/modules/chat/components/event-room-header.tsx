"use client";

import { Users } from "lucide-react";

import { cn } from "@/lib/utils";

import type { EventRoomHeaderProps } from "../types/event-room-header-props.types";

export function EventRoomHeader({
  groupName,
  participantCount,
}: EventRoomHeaderProps) {
  const participantLabel =
    participantCount === 1 ? "1 participante" : `${participantCount} participantes`;

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-full border border-accent bg-accent text-accent-foreground",
        )}
        aria-hidden="true"
      >
        <Users className="size-5" />
      </div>
      <div className="text-left">
        <h3 className="text-sm font-bold text-ink">{groupName}</h3>
        <p className="mt-0.5 text-xs text-text-secondary">
          {participantLabel}
        </p>
      </div>
    </div>
  );
}
