"use client";

import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatOptionsMenuProps {
  isBlocked: boolean;
  disabled?: boolean;
  onBlockSelect: () => void;
  onUnblockSelect: () => void;
}

/** Menú (⋯) de la cabecera de la sala de chat. */
export function ChatOptionsMenu({
  isBlocked,
  disabled = false,
  onBlockSelect,
  onUnblockSelect,
}: ChatOptionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid="chat-options-trigger"
        aria-label="Más opciones"
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-lg text-text-secondary hover:bg-surface-soft hover:text-ink"
          />
        }
      >
        <Ellipsis className="size-5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {isBlocked ? (
          <DropdownMenuItem data-testid="chat-option-unblock" onClick={onUnblockSelect}>
            Desbloquear usuario
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            data-testid="chat-option-block"
            variant="destructive"
            onClick={onBlockSelect}
          >
            Bloquear usuario
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}