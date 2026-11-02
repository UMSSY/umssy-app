import { CircleAlert, CircleCheck, CircleMinus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FIELD_RESULT_LABELS, QUEUED_DESCRIPTION, VALIDATION_FIELD_LABELS } from "../../constants/automatic-validation.constants";
import type { AutomaticValidationPanelProps } from "../../types/automatic-validation-props.types";
import { AutomationStatus } from "../inbox/automation-status";
import { MatchScoreBar } from "../inbox/match-score-bar";

const RESULT_ICONS = { match: CircleCheck, mismatch: CircleAlert, not_compared: CircleMinus } as const;
const RESULT_CLASS = { match: "text-ink", mismatch: "text-danger", not_compared: "text-text-secondary" } as const;

export function AutomaticValidationPanel({ detail }: AutomaticValidationPanelProps) {
  const validation = detail.validation;
  if (!validation) return null;

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface" aria-label="Validación automática">
      <header className="flex flex-col gap-3 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-tight text-lg font-bold text-ink">Validación automática</h2>
          <MatchScoreBar validation={validation} />
        </div>
        <AutomationStatus status={detail.status} validation={validation} />
        {validation.revertedBy ? <p className="text-xs text-text-secondary">Aprobación revertida por {validation.revertedBy}.</p> : null}
      </header>

      {validation.result === "queued" ? (
        <p className="border-t border-border px-5 py-4 text-sm text-text-secondary">{QUEUED_DESCRIPTION}. El contraste aparecerá cuando termine la lectura.</p>
      ) : (
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[26%]">Dato</TableHead>
              <TableHead className="w-[28%]">Declarado</TableHead>
              <TableHead className="w-[28%]">En el documento</TableHead>
              <TableHead>Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validation.fields.map((field) => {
              const Icon = RESULT_ICONS[field.result];
              return (
                <TableRow key={field.field} className="border-border">
                  <TableCell className="font-semibold whitespace-normal text-ink">{VALIDATION_FIELD_LABELS[field.field]}</TableCell>
                  <TableCell className="text-sm whitespace-normal text-ink">{field.declared}</TableCell>
                  <TableCell className="text-sm whitespace-normal text-ink">{field.read ?? "—"}</TableCell>
                  <TableCell className={`text-sm whitespace-normal ${RESULT_CLASS[field.result]}`}>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
                      {FIELD_RESULT_LABELS[field.result]}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
