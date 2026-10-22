"use client";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useLogout } from "../hooks/use-logout";
export function SessionLogoutMenuItem() {
  const handleLogout = useLogout();
  return <DropdownMenuItem onClick={handleLogout} className="gap-3 px-3 py-2.5 text-brand-red focus:bg-brand-soft focus:text-brand-red not-data-[variant=destructive]:focus:**:text-brand-red"><LogOut aria-hidden="true" />Cerrar sesión</DropdownMenuItem>;
}
