import { Mail, Monitor, Smartphone, type LucideIcon } from "lucide-react";
import type { NotificationChannel } from "@/modules/notifications";

export const NOTIFICATION_CHANNEL_OPTIONS: ReadonlyArray<{
  value: NotificationChannel;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "push", label: "En el celular (Push)", icon: Smartphone },
  { value: "email", label: "Solo por correo", icon: Mail },
  { value: "in-app", label: "Solo dentro de la app", icon: Monitor },
];