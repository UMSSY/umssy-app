"use client";

import { CalendarDays, Clock, History, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/shared/components/layout/page-heading";
import { usePendingParticipation } from "../../hooks/use-pending-participation";
import { formatParticipationDate } from "../../utils/format-participation-date";
import type { PendingParticipationProps } from "../../types/pending-participation-props.types";
import { PendingRequestDetailsDialog } from "./pending-request-details-dialog";
import { PendingRequestEditDialog } from "./pending-request-edit-dialog";
import { PendingRequestCancelDialog } from "./pending-request-cancel-dialog";
import { PendingRequestHistoryDialog } from "./pending-request-history-dialog";

export function PendingParticipation({ request, onCancelled, showHeading = true }: PendingParticipationProps) {
  const state = usePendingParticipation({ request, onCancelled });
  const { successMessage, areaNames, orientationNames, setOpenedAt, setDetailsOpen, openEdit, setHistoryOpen, cancelMutation, setCancelOpen } = state;
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      {showHeading && <PageHeading
        title="Mi participación como mentor"
        description="Consulta y administra tu solicitud de participación en la red de mentorías."
      />}

      {successMessage && (
        <div
          role="status"
          className="rounded-lg border border-border bg-surface-soft p-4 text-sm text-ink"
        >
          {successMessage}
        </div>
      )}

      <section className="space-y-6 rounded-lg border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="mt-1 size-6 text-accent" aria-hidden="true" />

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-ink">
                Solicitud pendiente
              </h2>

              <span className="inline-flex text-xs font-semibold text-text-secondary">
                Pendiente
              </span>

              <p className="text-sm text-text-secondary">
                Tu solicitud está registrada en la lista de espera.
                Los cupos se asignan siguiendo el orden de llegada (FIFO).
                Ya tienes una solicitud pendiente; no necesitas enviar otra.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => { setOpenedAt(Date.now()); setDetailsOpen(true); }}>
              Ver más detalles
            </Button>
            <Button variant="outline" onClick={openEdit}>
              <Pencil className="size-4" />
              Modificar solicitud
            </Button>

            <Button
              variant="outline"
              onClick={() => setHistoryOpen(true)}
            >
              <History className="size-4" />
              Ver historial
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                cancelMutation.reset();
                setCancelOpen(true);
              }}
            >
              <Trash2 className="size-4" />
              Cancelar solicitud
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-5 text-sm text-text-secondary">
          <CalendarDays className="size-5" aria-hidden="true" />
          <span>Registrada: {formatParticipationDate(request.queuedAt)}</span>
        </div>

        <div className="grid gap-6 border-t border-border pt-5 md:grid-cols-2">
          <section className="space-y-3">
            <h3 className="font-semibold text-ink">Áreas técnicas</h3>

            <div className="flex flex-wrap gap-2">
              {areaNames.map((name) => (
                <span
                  key={name}
                  className="rounded-md bg-surface-soft px-3 py-2 text-sm text-ink"
                >
                  {name}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold text-ink">
              Tipos de orientación
            </h3>

            <div className="flex flex-wrap gap-2">
              {orientationNames.map((name) => (
                <span
                  key={name}
                  className="rounded-md bg-surface-soft px-3 py-2 text-sm text-ink"
                >
                  {name}
                </span>
              ))}
            </div>
          </section>
        </div>

        <p className="border-t border-border pt-5 text-sm text-text-secondary">
          Modificar tus preferencias no cambia la fecha original de ingreso
          a la lista de espera. Si cancelas y solicitas nuevamente,
          perderás tu prioridad anterior.
        </p>
      </section>

      <PendingRequestDetailsDialog state={state} request={request} />

      <PendingRequestEditDialog state={state} request={request} />

      <PendingRequestCancelDialog state={state} request={request} />

      <PendingRequestHistoryDialog state={state} request={request} />
    </main>
  );
}
