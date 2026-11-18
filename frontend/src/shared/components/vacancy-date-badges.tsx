import { CalendarDays, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VacancyDateBadgesProps } from "@/shared/types/vacancy-date-badges-props.types";
import { formatBoliviaDate } from "@/shared/utils/date-time";

const DATE_BADGE_CLASS = "h-6 rounded-full border-availability-border bg-surface px-2.5 text-availability-foreground";

export function VacancyDateBadges({ publishedAt, expiresAt, className }: VacancyDateBadgesProps) {
  return (
    <ul aria-label="Fechas de la vacante" className={cn("flex flex-wrap gap-2", className)}>
      <li>
        <Badge variant="outline" className={DATE_BADGE_CLASS}>
          <Clock aria-hidden="true" />
          Publicado: {formatBoliviaDate(publishedAt)}
        </Badge>
      </li>
      {expiresAt ? (
        <li>
          <Badge variant="outline" className={DATE_BADGE_CLASS}>
            <CalendarDays aria-hidden="true" />
            Expira: {formatBoliviaDate(expiresAt)}
          </Badge>
        </li>
      ) : null}
    </ul>
  );
}
