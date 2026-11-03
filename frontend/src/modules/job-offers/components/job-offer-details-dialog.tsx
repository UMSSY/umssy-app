"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GOOGLE_MAPS_LINK_REGEX,
  NOT_SPECIFIED_TEXT,
  TOAST_OPTIONS,
} from "../constants/job-offers.constants";
import { useJobOfferDetails } from "../hooks/use-job-offer-details";
import type { JobOfferDetailsDialogProps } from "../types/job-offer-details-dialog-props.types";
import { formatVacancyCount } from "../utils/format-vacancy-count";
import { trapTabFocus } from "../utils/trap-tab-focus";
import { JobOfferHighlights } from "./job-offer-highlights";

const SECTION_TITLE_CLASSES = "mb-1 text-sm font-semibold text-ink";

function getSafeMapsUrl(value: string): string | null {
  const url = value.trim();
  return GOOGLE_MAPS_LINK_REGEX.test(url) ? url : null;
}

export function JobOfferDetailsDialog({
  companyId,
  jobOfferId,
  onClose,
}: JobOfferDetailsDialogProps) {
  const { offer, status, errorMessage } = useJobOfferDetails(companyId, jobOfferId);
  const safeMapsUrl = offer ? getSafeMapsUrl(offer.locationUrl) : null;

  // Si la vacante no se puede cargar se avisa y se vuelve a la lista sin dejar el pop-up abierto.
  useEffect(() => {
    if (status !== "error") return;
    toast.error(errorMessage, TOAST_OPTIONS);
    onClose();
  }, [status, errorMessage, onClose]);

  return (
    <Dialog open={status !== "error"} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={trapTabFocus}
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
          <DialogTitle className="text-lg font-bold text-ink">Detalle de Vacante</DialogTitle>
          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11"
                aria-label="Cerrar detalles de vacante"
              />
            }
          >
            <X aria-hidden="true" />
          </DialogClose>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {offer ? (
            <>
              <div>
                <h3 className="text-xl font-extrabold break-words text-accent sm:text-2xl">
                  {offer.title}
                </h3>
                <DialogDescription>{offer.company.name}</DialogDescription>
                <p className="mt-1 text-sm font-bold text-ink-soft">
                  {offer.category || NOT_SPECIFIED_TEXT}
                </p>
              </div>

              <JobOfferHighlights
                modality={offer.modality}
                contractType={offer.contractType}
                vacancies={formatVacancyCount(offer.positionsAvailable)}
                salary={offer.salaryRange || NOT_SPECIFIED_TEXT}
              />

              <p className="text-sm leading-relaxed break-words whitespace-pre-line text-ink-soft">
                {offer.description}
              </p>

              <section className="border-t border-border pt-4">
                <h4 className={SECTION_TITLE_CLASSES}>Idiomas</h4>
                <p className="text-sm text-text-secondary">{offer.languages || NOT_SPECIFIED_TEXT}</p>
              </section>

              <section className="border-t border-border pt-4">
                <h4 className={SECTION_TITLE_CLASSES}>Ubicación</h4>
                {offer.locationUrl ? (
                  safeMapsUrl ? (
                    <a
                      href={safeMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 text-sm text-accent underline underline-offset-4 hover:text-ink hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      Abrir ubicación
                      <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
                    </a>
                  ) : (
                    <p className="text-sm text-text-secondary">Enlace no disponible</p>
                  )
                ) : (
                  <p className="text-sm text-text-secondary">{NOT_SPECIFIED_TEXT}</p>
                )}
              </section>

              <section className="border-t border-border pt-4">
                <h4 className="mb-3 text-sm font-semibold text-ink">Habilidades técnicas</h4>
                {offer.skills.length > 0 ? (
                  <ul aria-label="Habilidades técnicas" className="flex flex-wrap gap-2">
                    {offer.skills.map((skill) => (
                      <li
                        key={skill.id}
                        className="rounded-full bg-interaction px-4 py-1.5 text-sm font-semibold text-ink-soft"
                      >
                        {skill.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-text-secondary">No se especificaron habilidades.</p>
                )}
              </section>
            </>
          ) : (
            <p role="status" className="py-8 text-sm text-text-secondary">
              Cargando detalles de la vacante...
            </p>
          )}
        </div>

        <footer className="flex justify-end border-t border-border px-5 py-3">
          <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
            Cerrar
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
