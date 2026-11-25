import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { APPLICATION_MESSAGES } from "../constants/application.constants";
import type { VacancyClosedBadgeProps } from "../types/vacancy-closed-badge-props.types";

export function VacancyClosedBadge({ className }: VacancyClosedBadgeProps) {
  return (
    <Badge variant="destructive" className={cn("border-destructive/30 bg-destructive/10", className)}>
      {APPLICATION_MESSAGES.vacancyClosed}
    </Badge>
  );
}
