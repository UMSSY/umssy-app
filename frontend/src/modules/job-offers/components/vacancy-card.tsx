import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JobOffer } from "../types/job-offer.types";

const dateFormatter = new Intl.DateTimeFormat("es-BO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export function VacancyCard({ offer }: { offer: JobOffer }) {
  return (
        <li className="flex items-end justify-between gap-4 rounded-lg border border-border bg-surface p-5">
      <div>
        <h3 className="text-base font-bold text-ink">{offer.title}</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Publicado: {dateFormatter.format(new Date(offer.createdAt))} · Modalidad:{" "}
          {offer.modality} · Postulantes: {offer.applicantsCount} candidatos
        </p>
        <p className="mt-1 text-sm text-text-secondary">Tipo de contrato: {offer.contractType}</p>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Ver postulantes
          </Button>
          <Button variant="outline" size="sm" disabled>
            Editar
          </Button>
        </div>
      </div>
      <Button
        type="button"
        size="icon-sm"
        aria-label={`Eliminar vacante ${offer.title}`}
        className="bg-destructive text-white hover:bg-destructive/90"
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  );
}