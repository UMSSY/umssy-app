"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { AUDIT_ROLE_LABELS } from "../../constants/audit-actions.constants";
import { EMPTY_VALUE } from "../../constants/audit-log.constants";
import type { AuditEventListProps } from "../../types/audit-log-component-props.types";
import { EvidenceButton } from "../evidence/evidence-button";
import { AuditActionBadge } from "./audit-action-badge";
import { AuditEventDate } from "./audit-event-date";

const SKELETON_CARDS = 3;

// Versión móvil del listado: una tarjeta por evento, solo texto y enlaces de consulta
export function AuditEventCards({ items, isLoading = false, loadingEvidenceId, onOpenEvidence }: AuditEventListProps) {
  if (isLoading) {
    return (
      <ul className="flex flex-col gap-3" aria-busy="true">
        {Array.from({ length: SKELETON_CARDS }, (_, index) => (
          <li key={index} data-testid="audit-skeleton-card" className="rounded-lg border border-border bg-surface p-4">
            <Skeleton className="h-16 w-full" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((event) => (
        <li key={event.id} className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-surface px-4 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-ink">{event.request.code || EMPTY_VALUE}</span>
            <AuditEventDate occurredAt={event.occurredAt} inline />
          </div>
          <div>
            <AuditActionBadge action={event.action} />
          </div>
          <p className="text-[13.5px] font-semibold break-words text-ink">
            {event.responsible.name.trim() || EMPTY_VALUE} · {AUDIT_ROLE_LABELS[event.responsible.role] ?? EMPTY_VALUE}
          </p>
          <p className="text-sm break-words text-ink">{event.detail || EMPTY_VALUE}</p>
          <EvidenceButton event={event} isLoading={loadingEvidenceId === event.id} onOpen={onOpenEvidence} />
        </li>
      ))}
    </ul>
  );
}
