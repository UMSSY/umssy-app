"use client";

import { CalendarCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ExpirationDateCardProps } from "../types/expiration-date-card-props.types";
import { formatDaysLeft, formatExpirationDate } from "../utils/format-expiration-date";
import { ConfirmDialog } from "./confirm-dialog";
import { ExpirationCalendar } from "./expiration-calendar";

export function ExpirationDateCard({ expiration, today = new Date() }: ExpirationDateCardProps) {
  const {
    status,
    selectedDate,
    confirmedDate,
    hasExpiration,
    toggleExpiration,
    selectDate,
    confirmDate,
    rejectDate,
    changeDate,
  } = expiration;
  const showCalendar = status === "selecting" || status === "confirming";

  return (
    <section
      aria-labelledby="expiration-title"
      className="mx-auto mt-6 max-w-3xl rounded-lg border border-border bg-surface p-4 sm:p-8"
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
          <div className="w-full rounded-lg border border-border sm:w-fit">
            <ExpirationCalendar
              selected={selectedDate ?? undefined}
              onSelect={selectDate}
              today={today}
            />
          </div>
          <p className="text-xs text-text-secondary">
            La vacante se cerrará a las 23:59 (hora de Bolivia) del día que elijas.
          </p>
        </div>
      )}

      {confirmedDate && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-interaction p-4">
          <CalendarCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
          <div className="space-y-1">
            <p className="text-sm text-ink">
              La vacante se cerrará automáticamente el{" "}
              <strong>{formatExpirationDate(confirmedDate)}</strong> a las 23:59 (hora de Bolivia).
            </p>
            <p className="text-sm text-text-secondary">
              {formatDaysLeft(confirmedDate, today)}. Al llegar la fecha dejará de mostrarse a los
              egresados.
            </p>
            <Button type="button" variant="link" className="h-auto min-h-11 px-0" onClick={changeDate}>
              Cambiar fecha
            </Button>
          </div>
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