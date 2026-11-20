import { Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { PUBLISHED_STATUS, STATUS_BADGE_CLASSES, STATUS_LABELS } from "../constants/job-offers.constants";
import type { VacancyCardProps } from "../types/vacancy-card-props.types";
import { formatOpenTime } from "../utils/format-open-time";
import { formatPublicationDate } from "../utils/format-publication-date";

export function VacancyCard({
  offer,
  onDetails,
  showStatus = false,
  onReopen,
  onClose,
  onDelete,
}: VacancyCardProps) {
  const isPublished = offer.status === PUBLISHED_STATUS;
  const isClosed = offer.status === "Cerrada";
  const isDeleted = offer.status === "Eliminada";

  return (
    <li
      className={cn(
        "relative flex items-end justify-between gap-4 rounded-lg border p-5",
        isDeleted ? "border-destructive/30 bg-destructive/10" : "border-border bg-surface",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <h3 className="min-w-0 text-base font-bold text-ink">
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
          <div className="flex shrink-0 flex-col items-end gap-1 text-sm text-text-secondary">
            {showStatus ? (
              <Badge className={STATUS_BADGE_CLASSES[offer.status]}>
                {STATUS_LABELS[offer.status] ?? offer.status}
              </Badge>
            ) : null}
            <p>Expiración: {offer.expiresAt ? formatPublicationDate(offer.expiresAt) : "Sin fecha de cierre"}</p>
          </div>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          Publicado: {formatPublicationDate(offer.publishedAt)} · {formatOpenTime(offer.publishedAt)} · Modalidad:{" "}
          {offer.modality} · Postulantes: {offer.applicantsCount} candidatos
        </p>
        <p className="mt-1 text-sm text-text-secondary">Tipo de contrato: {offer.contractType}</p>
        {isPublished ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/matching?vacancyId=${offer.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "max-md:h-11")}
            >
              Ver postulantes
            </Link>
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="max-md:h-11"
              disabled={!onReopen}
              onClick={() => onReopen?.(offer.id)}
            >
              Reabrir
            </Button>
          </div>
        ) : null}
      </div>
      {isPublished ? (
        <div className="flex shrink-0 flex-wrap items-end justify-end gap-2">
          {onClose ? (
            <Button
              type="button"
              size="sm"
              aria-label={`Cerrar vacante ${offer.title}`}
              className="cursor-pointer bg-blue-600 text-white hover:bg-blue-700 hover:text-white max-md:h-11"
              onClick={() => onClose(offer)}
            >
              Cerrar
            </Button>
          ) : null}

          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            aria-label={`Eliminar vacante ${offer.title}`}
            className="max-md:size-11"
            onClick={() => onDelete?.(offer)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </li>
  );
}
