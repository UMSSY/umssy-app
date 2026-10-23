"use client";

import { ExternalLink, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GOOGLE_MAPS_LINK_REGEX } from "../constants/vacancies.constants";
import { useJobOfferDetails } from "../hooks/use-job-offer-details";

interface JobOfferDetailsDialogProps {
  companyId: string;
  jobOfferId: string;
  onClose: () => void;
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-text-secondary">{label}</dt>
      <dd className="mt-1 text-sm break-words text-ink">{children}</dd>
    </div>
  );
}

function getSafeMapsUrl(value: string): string | null {
  const url = value.trim();
  return GOOGLE_MAPS_LINK_REGEX.test(url) ? url : null;
}

export function JobOfferDetailsDialog({
  companyId,
  jobOfferId,
  onClose,
}: JobOfferDetailsDialogProps) {
  const { offer, status, errorMessage, reload } = useJobOfferDetails(companyId, jobOfferId);
  const safeMapsUrl = offer ? getSafeMapsUrl(offer.locationUrl) : null;

  return (
    <Dialog open onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto p-5 sm:max-w-3xl sm:p-7"
      >
        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 min-h-11 min-w-11"
              aria-label="Cerrar detalles de vacante"
            />
          }
        >
          <X aria-hidden="true" />
        </DialogClose>
        {status === "loading" ? (
          <div role="status" className="space-y-4 py-8 text-sm text-text-secondary">
            Cargando detalles de la vacante...
          </div>
        ) : status === "error" ? (
          <section className="space-y-4 py-6" role="alert">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-ink">
                No se pudo abrir la vacante
              </DialogTitle>
              <DialogDescription>{errorMessage}</DialogDescription>
            </DialogHeader>
            <Button type="button" variant="outline" className="min-h-11" onClick={reload}>
              Reintentar
            </Button>
          </section>
        ) : offer ? (
          <>
            <DialogHeader className="border-b border-border pr-10 pb-4">
              <DialogTitle className="text-xl font-bold text-accent sm:text-2xl">
                {offer.title}
              </DialogTitle>
              <DialogDescription>{offer.company.name}</DialogDescription>
            </DialogHeader>
            <dl aria-label="Detalles de la vacante" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField label="Modalidad">{offer.modality || "No especificado"}</DetailField>
              <DetailField label="Tipo de contrato">{offer.contractType || "No especificado"}</DetailField>
              <DetailField label="Número de vacantes">
                {offer.positionsAvailable ?? "No especificado"}
              </DetailField>
              <DetailField label="Idiomas">{offer.languages || "No especificado"}</DetailField>
              <DetailField label="Ubicación en Google Maps">
                {offer.locationUrl ? (
                  safeMapsUrl ? (
                    <a
                      href={safeMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 text-accent underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      Abrir ubicación
                      <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
                    </a>
                  ) : (
                    "Enlace no disponible"
                  )
                ) : (
                  "No especificado"
                )}
              </DetailField>
              <DetailField label="Categoría">{offer.category || "No especificado"}</DetailField>
              <DetailField label="Salario">{offer.salaryRange || "No especificado"}</DetailField>
            </dl>
            <section aria-labelledby="job-offer-description" className="border-t border-border pt-4">
              <h2 id="job-offer-description" className="mb-2 font-semibold text-ink">
                Descripción del puesto
              </h2>
              <p className="max-w-prose text-sm leading-relaxed break-words whitespace-pre-line text-ink-soft">
                {offer.description}
              </p>
            </section>
            <section aria-labelledby="job-offer-skills" className="border-t border-border pt-4">
              <h2 id="job-offer-skills" className="mb-3 font-semibold text-ink">
                Habilidades técnicas
              </h2>
              {offer.skills.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {offer.skills.map((skill) => (
                    <li
                      key={skill.id}
                      className="rounded-md bg-interaction px-3 py-2 text-sm text-ink"
                    >
                      {skill.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-secondary">No se especificaron habilidades.</p>
              )}
            </section>
            <div className="flex justify-end border-t border-border pt-4">
              <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
