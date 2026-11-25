"use client";

import Link from "next/link";
import { ExternalLink, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditEventDetail } from "../../hooks/use-audit-event-detail";
import { useEvidenceViewer } from "../../hooks/use-evidence-viewer";
import type { AuditEventDetailPanelProps } from "../../types/audit-event-detail-panel-props.types";
import { formatEvidenceSize } from "../../utils/format-evidence-size";
import { EvidenceButton } from "../evidence/evidence-button";
import { EvidenceViewerDialog } from "../evidence/evidence-viewer-dialog";
import { AuditActionBadge } from "../list/audit-action-badge";
import { AuditEventDate } from "../list/audit-event-date";
import { AuditResponsibleCell } from "../list/audit-responsible-cell";

const LABEL_CLASS = "text-[11px] font-bold tracking-[0.08em] text-text-secondary";

export function AuditEventDetailPanel({ event, onClose, children }: AuditEventDetailPanelProps) {
  const { detail, isLoading, error } = useAuditEventDetail(event?.id ?? null);
  const evidence = useEvidenceViewer();

  return (
    <Sheet
      open={event !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 data-[side=right]:sm:max-w-[460px]">
        <SheetHeader className="gap-0 p-6 pb-5">
          <SheetTitle className="font-tight text-xl font-bold text-ink">Detalle del evento</SheetTitle>

          <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-text-secondary">
            <Lock className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            Solo lectura{event ? ` · ${event.code}` : ""}
          </p>

          {event ? (
            <div className="mt-3.5 flex flex-wrap items-center gap-3">
              <AuditActionBadge action={event.action} />
              <span className="flex items-center gap-1 text-[13px] text-ink">
                <AuditEventDate occurredAt={event.occurredAt} inline />
                (hora de Bolivia)
              </span>
            </div>
          ) : null}
        </SheetHeader>

        <div className="flex flex-col gap-5 border-t border-border p-6">
          {isLoading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : error || !detail ? (
            <p role="alert" className="text-sm text-text-secondary">
              No se pudo cargar el detalle del evento.
            </p>
          ) : (
            <>
              <div>
                <p className={LABEL_CLASS}>SOLICITUD</p>
                <p className="mt-1 text-[15px] font-bold text-ink">{detail.request.code}</p>
                <Link
                  href={`/backoffice/solicitudes/${detail.request.id}`}
                  className="mt-1.5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-accent underline-offset-4 hover:underline"
                >
                  <ExternalLink className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                  Abrir solicitud
                </Link>
              </div>

              <div>
                <p className={LABEL_CLASS}>PERSONA TITULADA</p>
                <p className="mt-1 text-sm text-ink">
                  {detail.applicant.fullName} · {detail.applicant.career} · Titulación {detail.applicant.graduationYear}
                </p>
              </div>

              <div>
                <p className={LABEL_CLASS}>RESPONSABLE</p>
                <div className="mt-2">
                  <AuditResponsibleCell responsible={detail.responsible} />
                </div>
              </div>

              {detail.rejectionReason ? (
                <div>
                  <p className={LABEL_CLASS}>MOTIVO DEL RECHAZO</p>
                  <p className="mt-1 text-sm text-danger">{detail.rejectionReason}</p>
                </div>
              ) : null}

              <div>
                <p className={LABEL_CLASS}>DOCUMENTO REVISADO</p>
                {detail.evidence && event ? (
                  <>
                    <p className="mt-1 text-sm wrap-break-word text-ink">
                      {detail.documentType ? `${detail.documentType} · ` : ""}
                      {detail.evidence.name}.{detail.evidence.extension} · {formatEvidenceSize(detail.evidence.size)}
                    </p>
                    <div className="mt-2">
                      <EvidenceButton event={event} isLoading={evidence.loadingId === event.id} onOpen={evidence.open} />
                    </div>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-text-secondary">Sin documento</p>
                )}
              </div>

              {children ? <div className="border-t border-border pt-5">{children}</div> : null}
            </>
          )}
        </div>

        <SheetFooter className="mt-auto flex-row items-center justify-between gap-4 border-t border-border p-6">
          <span className="text-[12.5px] text-text-secondary">Este evento no se puede editar ni borrar.</span>
          <SheetClose render={<Button type="button" />}>Cerrar</SheetClose>
        </SheetFooter>

        <EvidenceViewerDialog
          event={evidence.opened?.event ?? null}
          url={evidence.opened?.url ?? null}
          finalFocus={evidence.triggerRef}
          onClose={evidence.close}
        />
      </SheetContent>
    </Sheet>
  );
}
