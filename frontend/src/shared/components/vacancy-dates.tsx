import { CalendarDays, Clock } from "lucide-react";
import { formatPublicationDate } from "@/modules/job-offers/utils/format-publication-date";

function DateValue({ value, fallback }: { value?: string | null; fallback: string }) {
  if (!value || !Number.isFinite(Date.parse(value))) return <>{fallback}</>;
  return <time dateTime={value}>{formatPublicationDate(value)}</time>;
}

export function VacancyDates({ publishedAt, expiresAt }: { publishedAt?: string; expiresAt?: string | null }) {
  return (
    <dl aria-label="Fechas de la vacante" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary">
      <div className="flex items-center gap-1.5"><dt className="flex items-center gap-1"><Clock aria-hidden="true" className="size-4" />Publicado:</dt><dd><DateValue value={publishedAt} fallback="No disponible" /></dd></div>
      <div className="flex items-center gap-1.5"><dt className="flex items-center gap-1"><CalendarDays aria-hidden="true" className="size-4" />Expira:</dt><dd><DateValue value={expiresAt} fallback="Sin fecha de vencimiento" /></dd></div>
    </dl>
  );
}
