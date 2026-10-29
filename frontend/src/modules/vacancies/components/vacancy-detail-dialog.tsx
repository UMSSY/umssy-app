"use client";

import { BriefcaseBusiness, ExternalLink, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JobApplicationAction } from "@/modules/matching";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import type { VacancyDetailDialogProps } from "../types/vacancy-detail-dialog-props.types";
import { canApplyToVacancies } from "../utils/can-apply-to-vacancies";

export function VacancyDetailDialog({ vacancy, onClose }: VacancyDetailDialogProps) {
  const canApply = canApplyToVacancies(getAccessToken());

  return <Dialog open onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
    <DialogContent showCloseButton={false} className="max-h-editor-dialog overflow-y-auto p-7 sm:max-w-3xl">
      <DialogClose render={<Button variant="ghost" size="icon-sm" className="absolute top-4 right-4" aria-label="Cerrar detalle de vacante" />}><X aria-hidden="true" /></DialogClose>
      <DialogHeader className="border-b border-border pr-8 pb-5"><DialogTitle className="text-2xl font-bold text-accent">{vacancy?.cargo ?? "Vacante no encontrada"}</DialogTitle><DialogDescription>{vacancy?.empresa ?? "La oferta solicitada no está disponible. Puedes explorar otras vacantes."}</DialogDescription></DialogHeader>
      {vacancy ? <>
        <dl aria-label="Condiciones de la vacante" className="grid grid-cols-2 gap-5 rounded-lg bg-interaction p-5 text-sm">
          <div><dt className="text-xs text-availability-foreground">Salario</dt><dd className="mt-1 font-semibold text-accent">{vacancy.salario}</dd></div>
          <div><dt className="flex items-center gap-1 text-xs text-availability-foreground"><MapPin className="size-3.5" aria-hidden="true" />Modalidad</dt><dd className="mt-1 text-ink">{vacancy.modalidad}</dd></div>
          <div><dt className="flex items-center gap-1 text-xs text-availability-foreground"><BriefcaseBusiness className="size-3.5" aria-hidden="true" />Tipo de contrato</dt><dd className="mt-1 text-ink">{vacancy.tipoContrato}</dd></div>
          <div><dt className="text-xs text-availability-foreground">Puestos disponibles</dt><dd className="mt-1 text-ink tabular-nums">{vacancy.vacantes}</dd></div>
          <div><dt className="text-xs text-availability-foreground">Idiomas</dt><dd className="mt-1 text-ink">{vacancy.idiomas}</dd></div>
          {vacancy.ubicacionUrl ? <div><dt className="text-xs text-availability-foreground">Ubicación</dt><dd className="mt-1"><a href={vacancy.ubicacionUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline">Ver en el mapa<ExternalLink className="size-3.5" aria-hidden="true" /></a></dd></div> : null}
        </dl>
        <section aria-labelledby="vacancy-description"><h2 id="vacancy-description" className="mb-3 text-lg font-semibold">Descripción</h2><p className="max-w-prose text-sm leading-relaxed wrap-anywhere whitespace-pre-line text-ink-soft">{vacancy.descripcion}</p></section>
        {vacancy.requisitos.length > 0 ? <section aria-labelledby="vacancy-requirements" className="border-t border-border pt-5"><h2 id="vacancy-requirements" className="mb-3 text-lg font-semibold">Tecnologías requeridas</h2><ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">{vacancy.requisitos.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul></section> : null}
      </> : null}
      <div className="flex items-start justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Volver al listado</Button>
        {vacancy && canApply ? <JobApplicationAction jobOfferId={vacancy.id} /> : null}
      </div>
    </DialogContent>
  </Dialog>;
}
