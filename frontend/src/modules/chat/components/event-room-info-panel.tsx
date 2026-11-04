"use client";

import { Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { formatEventRoomCreatedAt, getInitials } from "../utils/date-formatter";
import type { EventRoomInfoPanelProps } from "../types/event-room-info-panel-props.types";

/**
 * Panel derecho "Info del grupo" (solo en pantallas grandes; oculto debajo de lg).
 * - Título "Info del grupo".
 * - Círculo grande con icono Users, nombre del grupo y "Creado el dd/mm/aa".
 * - "N participantes" y la lista: avatar con iniciales y nombre.
 *   El usuario actual aparece como "Tú".
 */
export function EventRoomInfoPanel({
  groupName,
  createdAt,
  participants,
  currentUserId,
}: EventRoomInfoPanelProps) {
  const participantLabel =
    participants.length === 1
      ? "1 participante"
      : `${participants.length} participantes`;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-ink">Info del grupo</h3>

      <div className="flex flex-col items-center gap-2">
        <div
          className={cn(
            "flex size-20 items-center justify-center rounded-full border border-accent bg-accent text-surface",
          )}
          aria-hidden="true"
        >
          <Users className="size-10" />
        </div>
        <p className="text-sm font-bold text-ink">{groupName}</p>
        <p className="text-xs text-text-secondary">
          Creado el {formatEventRoomCreatedAt(createdAt)}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-soft">
          {participantLabel}
        </p>
        <ul className="space-y-2">
          {participants.map((participant) => {
            const isCurrentUser = participant.id === currentUserId;
            return (
              <li key={participant.id} className="flex items-center gap-2">
                <Avatar size="default" className="size-7 border border-border bg-surface">
                  <AvatarFallback className="text-xs font-bold text-ink">
                    {getInitials(participant.fullName)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-ink">
                  {isCurrentUser ? "Tú" : participant.fullName}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
