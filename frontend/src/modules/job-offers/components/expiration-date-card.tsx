"use client";

import { Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ExpirationDate } from "../hooks/use-expiration-date";
import { formatExpirationDate } from "../utils/format-expiration-date";
import { ConfirmDialog } from "./confirm-dialog";
import { ExpirationCalendar } from "./expiration-calendar";

interface ExpirationDateCardProps {
  expiration: ExpirationDate;
}

export function ExpirationDateCard({ expiration }: ExpirationDateCardProps) {
  const {
    status,
    selectedDate,
    hasExpiration,
    toggleExpiration,
    selectDate,
    confirmDate,
    rejectDate,
  } = expiration;
  const showCalendar = status === "selecting" || status === "confirming";

  return (
    <section
      aria-labelledby="expiration-title"
      className="mx-auto mt-6 max-w-3xl rounded-lg border border-border bg-surface p-8"
    >
      <h4 id="expiration-title" className="text-base font-semibold text-ink">
        Fecha de cierre
      </h4>
      <p className="mt-1 text-sm text-text-secondary">
        Define hasta cuándo la vacante recibirá postulaciones.
      </p>

      <Label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
        <Checkbox checked={hasExpiration} onCheckedChange={(checked) => toggleExpiration(checked)} />
        Establecer fecha de expiración
      </Label>

      {!hasExpiration && (
        <p className="mt-2 flex items-start gap-2 text-sm text-text-secondary">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Sin fecha de cierre: la vacante seguirá publicada hasta que la cierres manualmente.
        </p>
      )}

      {showCalendar && (
        <div className="mt-4 space-y-2">
          <div className="w-fit rounded-lg border border-border">
            <ExpirationCalendar selected={selectedDate ?? undefined} onSelect={selectDate} />
          </div>
          <p className="text-xs text-text-secondary">
            La vacante se cerrará a las 23:59 (hora de Bolivia) del día que elijas.
          </p>
        </div>
      )}

      <ConfirmDialog
        isOpen={status === "confirming"}
        title="¿Confirmar fecha de cierre?"
        description={
          <>
            La vacante se cerrará el{" "}
            <strong>{selectedDate ? formatExpirationDate(selectedDate) : ""}</strong> a las 23:59
            (hora de Bolivia). ¿Estás de acuerdo?
          </>
        }
        confirmLabel="Sí, confirmar"
        cancelLabel="No"
        onConfirm={confirmDate}
        onCancel={rejectDate}
      />
    </section>
  );
}