"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import type { OrientationTypeResponse } from "../../types/orientation-type-response.types";

type OrientationStepProps = {
  orientationTypes: OrientationTypeResponse[];
  selectedOrientationTypeIds: string[];
  onSelectionChange: (ids: string[]) => void;
};

export function OrientationStep({
  orientationTypes,
  selectedOrientationTypeIds,
  onSelectionChange,
}: OrientationStepProps) {
  const selectedCount = selectedOrientationTypeIds.length;
  const hasSelection = selectedCount > 0;

  const toggleOrientation = (id: string) => {
    const isSelected = selectedOrientationTypeIds.includes(id);

    if (isSelected) {
      onSelectionChange(
        selectedOrientationTypeIds.filter(
          (orientationId) => orientationId !== id,
        ),
      );
      return;
    }

    onSelectionChange([...selectedOrientationTypeIds, id]);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold text-ink">
          Paso 3: Tipos de orientación
        </h2>

        <p className="mt-1 text-sm text-text-secondary">
          Selecciona los tipos de orientación que podrás brindar.
        </p>
      </div>

      <div className="rounded-md bg-surface-soft px-3 py-2 text-sm font-medium text-ink">
        {selectedCount} seleccionada{selectedCount === 1 ? "" : "s"}
      </div>

      {!hasSelection && (
        <p className="text-sm font-medium text-accent" role="alert">
          Debe seleccionarse al menos un tipo de orientación para continuar
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {orientationTypes.map((orientation) => {
          const isSelected = selectedOrientationTypeIds.includes(
            orientation.id,
          );

          return (
            <Button variant="ghost"
              key={orientation.id}
              type="button"
              onClick={() => toggleOrientation(orientation.id)}
              className={[
                "flex h-auto w-full flex-col items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                isSelected
                  ? "border-accent bg-interaction"
                  : "border-border bg-surface hover:border-border-strong",
              ].join(" ")}
              aria-pressed={isSelected}
            >
              <div className="flex w-full items-start justify-between">
                <span className="text-sm font-semibold text-ink">
                  {orientation.name}
                </span>

                <div
                  className={[
                    "flex h-5 w-5 items-center justify-center rounded border",
                    isSelected
                      ? "border-accent bg-accent text-surface"
                      : "border-border-strong bg-surface",
                  ].join(" ")}
                >
                  {isSelected && (
                    <CheckCircle
                      className="size-3.5"
                      strokeWidth={3}
                      aria-hidden
                    />
                  )}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
