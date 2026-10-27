import { Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CLOSED_STATUS,
  DELETED_STATUS,
  PUBLISHED_STATUS,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from "../constants/vacancies.constants";
import type { JobOffer } from "../types/job-offer.types";
import { ReopenVacancyButton } from "./reopen-vacancy-button";
import { getCurrentCompany } from "../utils/get-current-company";

const dateFormatter = new Intl.DateTimeFormat("es-BO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

interface VacancyCardProps {
  offer: JobOffer;
  onDetails: (id: string) => void;
  showStatus?: boolean;
}

export function VacancyCard({ offer, onDetails, showStatus = false}: VacancyCardProps) {
  const isPublished = offer.status === PUBLISHED_STATUS;
  const isClosed = offer.status === CLOSED_STATUS;
  const isDeleted = offer.status === DELETED_STATUS;
  const company = getCurrentCompany();
  const companyId = company?.id;

  return (
    <li
      className={cn(
        "relative flex items-end justify-between gap-4 rounded-lg border p-5",
        isDeleted ? "border-destructive/30 bg-destructive/10" : "border-border bg-surface",
      )}
    >
      {showStatus ? (
        <Badge className={cn("absolute top-4 right-5", STATUS_BADGE_CLASSES[offer.status])}>
          {STATUS_LABELS[offer.status] ?? offer.status}
        </Badge>
      ) : null}
      <div className={cn("min-w-0", showStatus && "pt-5")}>
        <h3 className="text-base font-bold text-ink">
          <Button
            type="button"
            variant="link"
            className={cn(
              "h-auto min-h-11 justify-start rounded-none border-0 bg-transparent p-0 text-left text-base font-bold text-ink hover:bg-transparent hover:text-ink",
              isDeleted && "text-text-secondary hover:text-text-secondary",
            )}
            onClick={() => onDetails(offer.id)}
          >
            {offer.title}
          </Button>
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          Publicado: {dateFormatter.format(new Date(offer.createdAt))} · Modalidad:{" "}
          {offer.modality} · Postulantes: {offer.applicantsCount} candidatos
        </p>
        <p className="mt-1 text-sm text-text-secondary">Tipo de contrato: {offer.contractType}</p>
        {isPublished ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="max-md:h-11" disabled>
              Ver postulantes
            </Button>
            <Link
              href={`/recruiters/job-offers/${offer.id}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "max-md:h-11")}
            >
              Editar
            </Link>
          </div>
        ) : null}
        {isClosed ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {/* INTEGRACIÓN HU6: Botón para reabrir la vacante */}
            {companyId ? (
              <ReopenVacancyButton
                jobOffer={offer}
                companyId={companyId}
              />
            ) : null}
          </div>
        ) : null}
      </div>
      {isPublished ? (
        <Button
          type="button"
          size="icon-sm"
          aria-label={`Eliminar vacante ${offer.title}`}
          className="bg-destructive text-white hover:bg-destructive/90 max-md:size-11"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      ) : null}
    </li>
  );
}