import type { LucideIcon } from "lucide-react";

export interface NotificationsInboxEmptyProps {
  icon: LucideIcon;
  title: string;
  description: string;
  titleAs?: "h2" | "h3";
}
