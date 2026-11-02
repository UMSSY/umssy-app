"use client";

import { TIMELINE_ACTION_LABELS, TIMELINE_ACTOR_LABELS } from "../../constants/automatic-validation.constants";
import { useRequestHistory } from "../../hooks/use-request-history";
import type { RequestTimelineProps } from "../../types/automatic-validation-props.types";
import { formatShortDate } from "../../utils/format-long-date";
import { HistoryCard } from "./history-card";

export function RequestTimeline({ detail }: RequestTimelineProps) {
  const { timeline } = useRequestHistory(detail.id);
  if (timeline.length === 0) return <HistoryCard detail={detail} />;

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5" aria-label="Historial de esta solicitud">
      <h2 className="text-base font-semibold text-ink">Historial de esta solicitud</h2>
      <ol className="flex flex-col gap-3">
        {timeline.map((item) => {
          const actor = item.actorRole === "administrativo" ? item.actorName : TIMELINE_ACTOR_LABELS[item.actorRole];
          return (
            <li key={item.id} className="flex gap-2 text-sm text-ink">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-soft" aria-hidden="true" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">{TIMELINE_ACTION_LABELS[item.action] ?? item.action}</span>
                <span className="text-xs text-text-secondary">
                  {actor ?? item.actorName} · {formatShortDate(item.occurredAt)}
                </span>
                {item.detail ? <span className="text-xs break-words text-text-secondary">{item.detail}</span> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
