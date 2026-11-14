import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { APPLICATION_STATUS_BADGE_CLASSES } from "../constants/application.constants";
import type { ApplicationStatusBadgeProps } from "../types/application-status-badge-props.types";

export function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  return <Badge className={cn("h-6 rounded-full px-3", APPLICATION_STATUS_BADGE_CLASSES[status])}>{status}</Badge>;
}
