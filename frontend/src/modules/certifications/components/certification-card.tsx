import { Pencil, Trash2 } from "lucide-react";
import { FileText, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CertificationCardProps } from "../types/certification-card-props.types";
import { formatIssueDate } from "../utils/format-issue-date";

export function CertificationCard({
  certification,
  isBusy = false,
  onEdit,
  onDelete,
  onViewDocument,
}: CertificationCardProps) {
  return (
    <article className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <h3 className="text-base font-bold [overflow-wrap:anywhere] break-words text-ink">{certification.name}</h3>
        <p className="mt-0.5 text-sm [overflow-wrap:anywhere] break-words text-text-secondary">
          {certification.issuingOrganization} · Obtenida el{" "}
          <time dateTime={certification.issueDate}>{formatIssueDate(certification.issueDate)}</time>
        </p>
        <div className="mt-2">
          {certification.hasDocument === true ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Previsualizar documento de ${certification.name}`}
              disabled={isBusy}
              onClick={() => onViewDocument(certification)}
              className="h-7 border-border-strong bg-surface px-2.5 text-xs font-semibold text-ink hover:bg-surface-soft"
            >
              <FileText aria-hidden="true" />
              Ver documento
            </Button>
          ) : (
            <Badge
              variant="outline"
              className="h-6 gap-1.5 border-border bg-surface-soft px-2.5 text-xs font-semibold text-ink-soft"
            >
              <TriangleAlert aria-hidden="true" />
              Sin documento de respaldo
            </Badge>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          aria-label={`Editar ${certification.name}`}
          disabled={isBusy}
          onClick={() => onEdit(certification)}
          className="size-9 p-0 text-ink-soft"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          aria-label={`Eliminar ${certification.name}`}
          disabled={isBusy}
          onClick={() => onDelete(certification)}
          className="size-9 p-0 text-danger hover:bg-brand-red/10 hover:text-danger"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}
