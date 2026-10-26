"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Clock, Info, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PageHeading } from "@/shared/components/layout/page-heading";
import { useSlotRequestPreview } from "../../hooks/use-slot-request-preview";
import { useOfferCountdown } from "../../hooks/use-offer-countdown";
import { ParticipationOverview } from "./participation-overview";

const deadlineFormat = new Intl.DateTimeFormat("es-BO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/La_Paz" });

export function SlotOfferParticipation() {
  const router = useRouter();
  const preview = useSlotRequestPreview();
  const countdown = useOfferCountdown(preview.offer?.expiresAt);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [scenario, setScenario] = useState<"success" | "error">("success");
  function close() {
    if (preview.isConfirming) return;
    setDetailsOpen(false);
    preview.dismissNotice();
  }

  if (preview.active) return <div className="space-y-6">
    {preview.enabled && <section aria-label="Activación simulada" className="space-y-3 rounded-lg border border-border bg-surface-soft p-4">
      <p role="status" className="text-sm font-semibold text-ink">Participación activa (simulación de desarrollo)</p>
      <p className="text-sm text-text-secondary">Esta vista es temporal. No se ha activado tu cuenta ni guardado la participación en el servidor. Al recargar se vuelve al formulario.</p>
      <Button variant="outline" onClick={preview.reset}>Volver al formulario y probar otro escenario</Button>
    </section>}
    <ParticipationOverview areas={preview.active.areas} orientations={preview.active.orientations} />
    <Dialog open={preview.notice === "confirmed"} onOpenChange={(open) => { if (!open) preview.dismissNotice(); }}>
      <DialogContent><DialogTitle>Participación confirmada correctamente</DialogTitle><DialogDescription>{preview.enabled ? "Confirmación simulada de desarrollo. No se han modificado PostgreSQL, tus roles ni la activación real." : "Ya formas parte de la red de mentores."}</DialogDescription><div className="flex justify-end"><Button onClick={preview.dismissNotice}>Cerrar</Button></div></DialogContent>
    </Dialog>
  </div>;

  const offer = preview.offer;
  if (!offer) return null;
  const deadline = deadlineFormat.format(new Date(offer.expiresAt));
  return <main className="mx-auto max-w-7xl space-y-6">
    <PageHeading title="Mi participación como mentor" description="Gestiona la información relacionada con tu participación en la red de mentorías." />
    {preview.enabled && <p className="rounded-lg border border-border bg-surface-soft p-4 text-xs text-text-secondary">Oferta simulada de desarrollo, conservada en memoria. No representa una asignación ni una activación real en PostgreSQL.</p>}
    <section className="space-y-4 rounded-lg border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="font-semibold text-ink">Estado de participación <span className="ml-2 rounded bg-availability px-2 py-1 text-sm text-accent">{countdown.expired ? "Plazo vencido" : "Cupo ofrecido"}</span></h2><Button variant="secondary" onClick={() => { countdown.refresh(); setDetailsOpen(true); }}>Ver oferta</Button></div>
      <p className="text-sm text-text-secondary">{countdown.expired ? "El plazo ha vencido" : "Tienes un cupo disponible. Confirma tu participación dentro del plazo indicado."}</p>
      <p className="text-sm text-ink">Fecha y hora límite: <strong>{deadline} BOT (UTC-4)</strong></p>
      <p role="timer" aria-label="Tiempo restante de la oferta" className="text-sm font-semibold text-accent">{countdown.expired ? "El plazo ha vencido" : countdown.label}</p>
      {countdown.expired && <div className="space-y-3">
        <p className="text-sm text-text-secondary">{offer.canRequestAgain ? "El estado simulado permite registrar una nueva solicitud." : "Debes esperar a que el servidor permita registrar una nueva solicitud. El vencimiento del contador no concede esa autorización."}</p>
        <Button disabled={!offer.canRequestAgain} onClick={() => { if (preview.enabled) preview.restartAfterExpiry(); else router.push("/mentorship"); }}>Volver a solicitar cupo</Button>
        {preview.enabled && !offer.canRequestAgain && <div><Button size="sm" variant="outline" onClick={preview.allowNewRequest}>Simular autorización del servidor para nueva solicitud</Button></div>}
      </div>}
    </section>

    <Dialog open={detailsOpen || preview.notice === "offered"} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent showCloseButton={!preview.isConfirming} aria-busy={preview.isConfirming} className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <header className="flex items-center gap-4"><span className="rounded-full bg-brand-soft p-3 text-brand-red"><Bell aria-hidden="true" /></span><div className="space-y-2"><p className="text-xs font-semibold text-ink">NOTIFICACIÓN PRIORITARIA · Cupo ofrecido</p><DialogTitle className="text-xl leading-tight font-bold text-ink">¡Tienes un cupo disponible!</DialogTitle></div></header>
        <DialogDescription>Se ha liberado un cupo para ti. Tienes 24 horas para confirmar tu participación en el programa oficial de mentores.</DialogDescription>
        <div className="space-y-3 rounded-lg border border-border bg-surface-soft p-4"><p className="flex items-center gap-2 font-semibold text-ink"><Clock aria-hidden="true" className="size-5" />Plazo de confirmación (24 horas)</p><p role="timer" aria-label="Tiempo restante para confirmar" className="font-semibold text-brand-red">{countdown.expired ? "El plazo ha vencido" : countdown.label}</p><p className="border-t border-border pt-3 text-sm text-text-secondary">Fecha y hora límite: <strong className="text-ink">{deadline} BOT (UTC-4)</strong></p></div>
        <div className="rounded-lg border border-border bg-availability p-4"><p className="font-semibold text-ink">Continuidad del proceso:</p><p className="mt-1 text-sm leading-relaxed text-text-secondary">Al pulsar Confirmar participación se validará el plazo. Si la confirmación tiene éxito, verás tu participación activa con la configuración que ya elegiste.</p></div>
        <div className="rounded-lg border border-border bg-surface-soft p-4"><p className="font-semibold text-ink">En caso de expiración:</p><p className="mt-1 text-sm leading-relaxed text-text-secondary">Si no confirmas dentro de las 24 horas, el cupo será liberado. Una nueva solicitud requiere que el estado informado por el servidor lo permita.</p></div>
        <p className="flex items-start gap-2 text-xs text-text-secondary"><Info aria-hidden="true" className="size-4 shrink-0" />El servidor verificará el plazo cuando confirmes.</p>
        {preview.enabled && <fieldset disabled={preview.isConfirming || countdown.expired} className="space-y-2 rounded-lg border border-border p-3"><legend className="px-1 text-xs text-text-secondary">Respuesta simulada de confirmación</legend><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={preview.isConfirming || countdown.expired} aria-pressed={scenario === "success"} onClick={() => setScenario("success")}>Confirmación exitosa</Button><Button size="sm" variant="outline" disabled={preview.isConfirming || countdown.expired} aria-pressed={scenario === "error"} onClick={() => setScenario("error")}>Error al confirmar</Button></div></fieldset>}
        {preview.confirmationError && <p role="alert" className="text-sm text-destructive">{preview.confirmationError}</p>}
        <footer className="flex flex-wrap justify-end gap-3"><Button variant="outline" disabled={preview.isConfirming} onClick={close}>Volver</Button><Button disabled={preview.isConfirming || countdown.expired} onClick={async () => { await preview.confirmOffer(scenario); countdown.refresh(); }}>{preview.isConfirming ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Check aria-hidden="true" />}{preview.isConfirming ? "Confirmando participación..." : "Confirmar participación"}</Button></footer>
      </DialogContent>
    </Dialog>
  </main>;
}
