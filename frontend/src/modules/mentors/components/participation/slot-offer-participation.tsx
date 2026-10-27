"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  const [open, setOpen] = useState(false);
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
      <DialogContent showCloseButton={!confirmation.isPending} aria-busy={confirmation.isPending} className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogTitle>¡Tienes un cupo disponible!</DialogTitle>
        <DialogDescription>Se ha liberado un cupo para ti. Confirma tu participación dentro de las 24 horas desde su asignación.</DialogDescription>
        <div className="space-y-3 rounded-lg bg-surface-soft p-4">
          <h3 className="font-semibold">Plazo para confirmar</h3>
          <p>{deadline} BOT (UTC-4)</p>
          <p role="timer" aria-label="Tiempo restante para confirmar">{countdown.label}</p>
        </div>
        <p>Si no confirmas a tiempo, el cupo se ofrecerá al siguiente solicitante. Podrás ingresar de nuevo al final de la lista de espera.</p>
        {confirmation.isError && <p role="alert">{participationErrorMessage(confirmation.error)}</p>}
        <footer className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" disabled={confirmation.isPending} onClick={() => setOpen(false)}>Volver</Button>
          <Button disabled={confirmation.isPending || countdown.expired} onClick={() => void confirm()}>{confirmation.isPending ? "Confirmando..." : "Confirmar participación"}</Button>
        </footer>
      </DialogContent>
    </Dialog>
  </main>;
}
