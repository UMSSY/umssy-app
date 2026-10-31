"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PageHeading } from "@/shared/components/layout/page-heading";
import { useAuth } from "@/shared/contexts/auth-context";
import { useOfferCountdown } from "../../hooks/use-offer-countdown";
import { mentorParticipationService, type MentorParticipationRequest } from "../../services/mentor-participation.service";
import { participationErrorMessage } from "../../utils/participation-error";

export function SlotOfferParticipation({ request, onConfirmed, showHeading = true }: {
  request: MentorParticipationRequest;
  onConfirmed: () => void;
  showHeading?: boolean;
}) {
  const offer = request.offer!;
  const countdown = useOfferCountdown(offer.expiresAt);
  const client = useQueryClient();
  const { refreshRoles } = useAuth();
  const [open, setOpen] = useState(() => !countdown.expired);
  const inFlight = useRef(false);
  const expiredChecked = useRef(false);
  const confirmation = useMutation({
    mutationFn: () => mentorParticipationService.confirm(offer.id),
    onSuccess: async () => {
      // Reconcile the participation view even if refreshing session roles fails.
      await Promise.allSettled([
        refreshRoles(),
        client.invalidateQueries({ queryKey: ["mentors", "participation"] }),
        client.invalidateQueries({ queryKey: ["mentor-participation-requests"] }),
      ]);
      onConfirmed();
    },
    onError: () => { void client.invalidateQueries({ queryKey: ["mentor-participation-requests"] }); },
  });
  useEffect(() => {
    if (countdown.expired && !expiredChecked.current) {
      expiredChecked.current = true;
      void client.invalidateQueries({ queryKey: ["mentor-participation-requests"] });
    }
  }, [countdown.expired, client]);

  const deadline = new Intl.DateTimeFormat("es-BO", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    hourCycle: "h23", timeZone: "America/La_Paz",
  }).format(new Date(offer.expiresAt));

  async function confirm() {
    if (inFlight.current || countdown.expired || Date.now() >= new Date(offer.expiresAt).getTime()) return;
    inFlight.current = true;
    try { await confirmation.mutateAsync(); } catch { /* Render mutation error below. */ }
    finally { inFlight.current = false; }
  }

  return <main className="mx-auto max-w-7xl space-y-6">
    {showHeading && <PageHeading title="Mi participación como mentor" />}
    <section className="space-y-4 rounded-lg border border-border bg-surface p-6">
      <h2 className="text-xl font-semibold text-ink">{countdown.expired ? "Plazo vencido" : "Cupo ofrecido"}</h2>
      <p>Fecha y hora límite: {deadline} BOT (UTC-4)</p>
      <p role="timer" aria-label="Tiempo restante de la oferta">{countdown.label}</p>
      {countdown.expired && <p>Actualizando el estado de tu solicitud. Podrás solicitar un cupo nuevamente cuando se confirme el vencimiento.</p>}
      <Button onClick={() => setOpen(true)}>Ver oferta</Button>
    </section>
    <Dialog open={open} onOpenChange={(value) => { if (!inFlight.current) setOpen(value); }}>
      <DialogContent showCloseButton={!confirmation.isPending} aria-busy={confirmation.isPending} className="max-h-[calc(100dvh-2rem)] grid-cols-1 gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <header className="flex items-center gap-4 border-b border-border px-5 py-5 pr-12 sm:px-7 sm:pr-12">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Bell aria-hidden="true" size={28} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase text-text-secondary">Notificación prioritaria</p>
              <span className="rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">Cupo ofrecido</span>
            </div>
            <DialogTitle className="mt-1 text-xl leading-tight font-bold text-ink sm:text-2xl">¡Tienes un cupo disponible!</DialogTitle>
          </div>
        </header>
        <div className="space-y-4 px-5 py-5 sm:px-7">
          <DialogDescription className="text-base leading-relaxed text-text-secondary">Se ha liberado un cupo para ti. Tienes 24 horas desde su asignación para confirmar tu participación en el programa de mentores.</DialogDescription>
          <div className="space-y-3 rounded-lg border border-border bg-surface-soft p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-3 font-bold text-ink"><Clock aria-hidden="true" className="size-5 text-red-600" />Plazo de confirmación (24 horas)</h3>
              <p role="timer" aria-label="Tiempo restante para confirmar" className="rounded-md bg-red-100 px-2 py-1 text-sm font-semibold text-red-700">{countdown.label}</p>
            </div>
            <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-3 text-sm">
              <span className="text-text-secondary">Fecha y hora límite:</span>
              <span className="font-bold text-ink">{deadline} BOT (UTC-4)</span>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <Bell aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-700" />
            <div><h3 className="font-bold text-emerald-800">Continuidad del proceso:</h3><p className="mt-1 text-sm leading-relaxed text-text-secondary">Al pulsar Confirmar participación se validará tu plazo y se aplicará la activación como mentor con la configuración ya revisada.</p></div>
          </div>
          <div className="flex items-start gap-4 rounded-lg border border-availability bg-interaction p-4">
            <Clock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-availability-foreground" />
            <div><h3 className="font-bold text-ink">En caso de expiración:</h3><p className="mt-1 text-sm leading-relaxed text-text-secondary">Si no confirmas dentro del plazo, el cupo será liberado y podrás registrar una nueva solicitud para ingresar al siguiente ciclo de asignación FIFO.</p></div>
          </div>
          <p className="flex items-start gap-3 text-sm leading-relaxed text-text-secondary"><Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />Si no confirmas dentro del plazo, el cupo se reasigna al siguiente postulante en espera.</p>
          {confirmation.isError && <p role="alert" className="text-sm text-danger">{participationErrorMessage(confirmation.error)}</p>}
        </div>
        <footer className="flex flex-col-reverse gap-3 rounded-b-xl bg-surface-soft px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <Button variant="outline" disabled={confirmation.isPending} onClick={() => setOpen(false)} className="min-h-10 px-6">Volver</Button>
          <Button disabled={confirmation.isPending || countdown.expired} onClick={() => void confirm()} className="min-h-10 gap-2 px-6"><Check aria-hidden="true" size={18} />{confirmation.isPending ? "Confirmando..." : "Confirmar participación"}</Button>
        </footer>
      </DialogContent>
    </Dialog>
  </main>;
}
