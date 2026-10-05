import { Inbox } from "lucide-react";
import type { AppShellProps } from "@/shared/types/app-shell-props.types";

// Fuera del Sprint 1: "Registro de auditoría" y la campana de notificaciones
export const BACKOFFICE_NAVIGATION: NonNullable<AppShellProps["items"]> = [
  { label: "Solicitudes", href: "/backoffice/requests", icon: Inbox },
];