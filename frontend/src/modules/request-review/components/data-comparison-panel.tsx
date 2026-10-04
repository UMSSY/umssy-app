"use client";

import { useId } from "react";
import { CheckCircle2, CircleHelp } from "lucide-react";
import { Input } from "@/components/ui/input";
import type {
  ComparisonField,
  DataComparisonProps,
} from "../types/data-comparison-props";

function normalizeValue(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}

function getIsMatching(field: ComparisonField): boolean {
  const declaredValue = normalizeValue(field.declaredValue);
  const documentValue = normalizeValue(field.documentValue);

  return (
    declaredValue.length > 0 &&
    documentValue.length > 0 &&
    declaredValue === documentValue
  );
}

export function DataComparisonPanel({
  fields,
  isEditable = false,
  onDocumentValueChange,
}: DataComparisonProps) {
  const panelId = useId();
  const matchingCount = fields.filter(getIsMatching).length;
  const pendingCount = fields.length - matchingCount;
  const canEdit = isEditable && Boolean(onDocumentValueChange);

  return (
    <section
      aria-labelledby={`${panelId}-title`}
      className="rounded-lg border border-border bg-surface p-4"
    >
      <h2
        id={`${panelId}-title`}
        className="text-lg font-bold text-ink"
      >
        Contraste de datos
      </h2>

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mt-1 text-xs text-text-secondary"
      >
        {matchingCount} coinciden · {pendingCount} por verificar
      </p>

      <p className="mt-3 text-xs text-text-secondary">
        Compare los datos declarados con el documento de respaldo.
        Los valores vacíos o diferentes quedan por verificar.
      </p>

      {fields.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">
          No hay datos disponibles para contrastar.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {fields.map((field, index) => {
            const isMatching = getIsMatching(field);
            const inputId = `${panelId}-document-${index}`;

            return (
              <div
                key={field.id}
                className="border-b border-border pb-4 last:border-b-0 last:pb-0"
              >
                <h3 className="mb-2 text-sm font-semibold text-ink">
                  {field.label}
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs text-text-secondary">
                      Declarado
                    </p>
                    <p className="break-words text-sm text-ink-soft">
                      {field.declaredValue.trim() || "Sin dato declarado"}
                    </p>
                  </div>

                  <div>
                    {canEdit ? (
                      <>
                        <label
                          htmlFor={inputId}
                          className="mb-1 block text-xs text-text-secondary"
                        >
                          {field.label} en el documento
                        </label>
                        <Input
                          id={inputId}
                          value={field.documentValue}
                          placeholder="Registrar si figura"
                          onChange={(event) =>
                            onDocumentValueChange?.(
                              field.id,
                              event.target.value,
                            )
                          }
                        />
                      </>
                    ) : (
                      <>
                        <p className="mb-1 text-xs text-text-secondary">
                          En el documento
                        </p>
                        <p className="break-words text-sm text-ink-soft">
                          {field.documentValue.trim() ||
                            "Sin valor registrado"}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
                  {isMatching ? (
                    <CheckCircle2
                      aria-hidden="true"
                      className="size-4 shrink-0"
                    />
                  ) : (
                    <CircleHelp
                      aria-hidden="true"
                      className="size-4 shrink-0"
                    />
                  )}
                  {isMatching ? "Coincide" : "Por verificar"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}