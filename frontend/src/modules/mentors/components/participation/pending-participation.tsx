"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, CalendarDays, CheckCircle, Clock, Info, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PageHeading } from "@/shared/components/layout/page-heading";
import { useSlotRequestPreview } from "../../hooks/use-slot-request-preview";
import { CancelSlotRequestDialog } from "./cancel-slot-request-dialog";

export function PendingParticipation() {
  const router = useRouter();
  const preview = useSlotRequestPreview();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(() => Date.now());
  const request = preview.request;
  if (!request) return null;
  const elapsed = Math.max(0, openedAt - new Date(request.registeredAt).getTime());
  const days = Math.floor(elapsed / 86400000);
  const hours = Math.floor(elapsed / 3600000);
  const age = days > 0 ? `hace ${days} ${days === 1 ? "día" : "días"}` : hours > 0 ? `hace ${hours} ${hours === 1 ? "hora" : "horas"}` : "hace menos de una hora";
  const date = new Intl.DateTimeFormat("es-BO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/La_Paz" }).format(new Date(request.registeredAt));
  const duplicateMessage = "No necesitas solicitar nuevamente. El envío redundante de postulaciones no acelera el proceso de asignación de vacantes.";

  return <main className="mx-auto max-w-7xl space-y-6">
    <PageHeading title="Mi participación como mentor" description="Gestiona la información relacionada con tu participación en la red de mentorías." />
    {preview.enabled && <aside className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-soft p-4">
      <p className="text-xs text-text-secondary">Solicitud simulada de desarrollo, conservada solo en memoria. No está registrada en PostgreSQL y se descarta al recargar.</p>
      <Button size="sm" variant="outline" onClick={preview.reset}>Reiniciar simulación</Button>
      <div className="flex flex-wrap gap-2" aria-label="Simulación de oferta de cupo"><Button size="sm" variant="outline" onClick={() => preview.offerSlot()}>Simular cupo ofrecido</Button><Button size="sm" variant="outline" onClick={() => preview.offerSlot(true)}>Simular oferta vencida</Button></div>
    </aside>}
    <section className="divide-y divide-border rounded-lg border border-border bg-surface px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 py-6">
        <div className="flex items-start gap-4"><span className="rounded-full bg-notice p-3 text-notice-foreground"><Users aria-hidden="true" /></span><div><h2 className="font-semibold text-ink">Estado de participación <span className="ml-2 rounded bg-notice px-2 py-1 text-xs text-notice-foreground">Pendiente</span></h2><p className="mt-2 text-sm text-text-secondary">Tu solicitud está en espera de disponibilidad de cupos.</p></div></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => { setOpenedAt(Date.now()); setDetailsOpen(true); }}>Ver detalle</Button>
          <Button variant="secondary" onClick={() => { preview.clearCancellationError(); setCancelOpen(true); }}>Cancelar solicitud</Button>
        </div>
      </div>
      {[{ title: "Áreas técnicas", items: request.areas }, { title: "Tipos de orientación", items: request.orientations }].map(({ title, items }) => <section key={title} className="space-y-3 py-5"><h2 className="font-semibold text-ink">{title}</h2><div className="flex flex-wrap gap-2">{items.map((name) => <span key={name} className="rounded bg-surface-soft px-3 py-2 text-sm text-ink">{name}</span>)}{items.length === 0 && <p className="text-sm text-text-secondary">Sin selección en esta prueba.</p>}</div></section>)}
    </section>
    <p className="flex items-start gap-2 text-sm text-text-secondary"><Info aria-hidden="true" className="size-5 shrink-0" />Ya tienes una solicitud activa. {duplicateMessage}</p>

    <CancelSlotRequestDialog open={cancelOpen} isPreview={preview.enabled} isCancelling={preview.isCancelling} error={preview.cancellationError} onOpenChange={setCancelOpen} onConfirm={async (scenario) => {
      if (await preview.cancel(scenario)) router.push("/mentors/participation");
    }} />

    <Dialog open={preview.notice === "registered" || preview.notice === "duplicate"} onOpenChange={(open) => { if (!open) preview.dismissNotice(); }}>
      <DialogContent className="sm:max-w-lg">
        <CheckCircle aria-hidden="true" className="size-8 text-accent" />
        <DialogTitle className="text-xl font-bold text-ink">{preview.notice === "registered" ? "Solicitud registrada correctamente" : "Ya tienes una solicitud pendiente"}</DialogTitle>
        <DialogDescription>{preview.notice === "registered" ? "Tu solicitud quedó registrada. Te avisaremos por la plataforma y a tu correo institucional cuando se libere un cupo." : duplicateMessage}</DialogDescription>
        <div className="rounded-lg bg-surface-soft p-4 text-sm text-ink"><p className="font-semibold">Estado: Pendiente</p><p className="mt-2">Ya tienes una solicitud pendiente. {duplicateMessage}</p></div>
        {preview.enabled && <p className="text-xs text-text-secondary">Datos simulados para desarrollo; no se ha realizado un registro en PostgreSQL.</p>}
        <div className="flex justify-end"><Button onClick={preview.dismissNotice}>Cerrar</Button></div>
      </DialogContent>
    </Dialog>

    <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <div className="flex items-center gap-4"><span className="rounded-full bg-notice p-3 text-notice-foreground"><Clock aria-hidden="true" /></span><div className="space-y-2"><p className="text-xs font-semibold text-notice-foreground">Estado: Pendiente</p><DialogTitle className="text-xl font-bold text-ink">Solicitud pendiente</DialogTitle></div></div>
        <DialogDescription>Tu solicitud sigue en espera. Aún no hay cupos disponibles. Te notificaremos cuando se libere un cupo por la plataforma y a tu correo institucional.</DialogDescription>
        <div className="flex items-start gap-4 rounded-lg border border-border bg-surface-soft p-4"><CalendarDays aria-hidden="true" className="shrink-0 text-accent" /><div><p className="font-semibold text-ink">Solicitud enviada {age}</p><p className="mt-1 text-sm text-text-secondary">Registrada el {date}</p></div></div>
        <p className="text-sm text-ink">Áreas técnicas: {request.areas.join(", ")}</p>
        <p className="text-sm text-ink">Tipos de orientación: {request.orientations.join(", ")}</p>
        <div className="flex items-start gap-4 rounded-lg border border-border bg-surface-soft p-4"><Info aria-hidden="true" className="shrink-0 text-accent" /><div><p className="font-semibold text-ink">Ya tienes una solicitud activa</p><p className="mt-1 text-sm leading-relaxed text-text-secondary">{duplicateMessage}</p></div></div>
        <p className="flex flex-wrap items-center gap-2 text-sm text-text-secondary"><AtSign aria-hidden="true" className="size-4" />Notificaciones dirigidas a: <strong className="break-all text-ink">{preview.email}</strong></p>
        {preview.enabled && <p className="text-xs text-text-secondary">Solicitud simulada de desarrollo.</p>}
        <div className="flex justify-end"><Button onClick={() => setDetailsOpen(false)}>Volver</Button></div>
      </DialogContent>
    </Dialog>
  </main>;
}
