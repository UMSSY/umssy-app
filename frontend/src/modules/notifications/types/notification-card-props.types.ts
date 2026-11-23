import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface NotificationCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isHighlighted: boolean;
  action: ReactNode;
  dateTime?: string;
  timeLabel?: string;
  iconClassName?: string;
}
