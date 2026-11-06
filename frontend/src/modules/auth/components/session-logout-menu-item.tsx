"use client";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { SessionLogoutMenuItemProps } from "../types/session-logout-menu-item-props.types";
// La confirmación vive en quien monta el menú: al elegir esta opción el desplegable se cierra y con él este componente
export function SessionLogoutMenuItem({ onSelect }: SessionLogoutMenuItemProps) {
  return <DropdownMenuItem onClick={onSelect} className="gap-3 px-3 py-2.5 text-brand-red focus:bg-brand-soft focus:text-brand-red not-data-[variant=destructive]:focus:**:text-brand-red"><LogOut aria-hidden="true" />Cerrar sesión</DropdownMenuItem>;
}
