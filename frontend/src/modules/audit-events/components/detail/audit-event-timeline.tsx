"use client";

import { cn } from "cn";
import { Skeleton } from "@/components/ui/skeleton";
import { AUDIT_ACTION_STYLES } from "../../constants/audit-actions.constants";
import { useAuditEventTimeline } from "../../hooks/use-audit-event-timeline";
import type { AuditEventTimelineProps } from "../../types/audit-event-timeline-props.types";
import { AuditEventDate } from "../list/audit-event-date";

export function AuditEventTimeline({ eventId }: AuditEventTimelineProps) {
  const { timeline, isLoading, error } = useAuditEventTimeline(eventId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error || !timeline) {
    return (
      <p role="alert" className="text-sm text-text-secondary">
        No se pudo cargar el historial de la solicitud.
      </p>
    );
  }

  return (
    <section aria-label={`Historial de ${timeline.requestCode}`}>
      <h3 className="font-tight text-[15px] font-bold text-ink">
        Historial de {timeline.requestCode}
      </h3>

      <ol className="relative mt-3 flex flex-col gap-3.5 pl-1">
        {timeline.items.map((item) => {
          const isFocused = item.id === timeline.focusedEventId;
          return (
            <li key={item.id} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-1.5 size-2.5 shrink-0 rounded-full",
                  isFocused ? "bg-brand-red" : "bg-border-strong",
                )}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className={cn("text-[13.5px] leading-snug", isFocused ? "font-bold text-danger" : "text-ink")}>
                  {AUDIT_ACTION_STYLES[item.action].label} · {item.actorName}
                </p>
                <AuditEventDate occurredAt={item.occurredAt} inline />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
