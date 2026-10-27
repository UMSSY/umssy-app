"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { participationErrorMessage } from "../../utils/participation-error";
import type { PendingRequestDialogProps } from "../../types/pending-request-dialog-props.types";

export function PendingRequestEditDialog({ state }: PendingRequestDialogProps) {
  const { technicalAreas, orientationTypes, isTechnicalAreasLoading, isOrientationTypesLoading, editOpen, setEditOpen, selectedAreas, setSelectedAreas, selectedOrientations, setSelectedOrientations, updateMutation, toggleId, runOperation } = state;
  return (
      <Dialog open={editOpen} onOpenChange={(value) => { if (!updateMutation.isPending) setEditOpen(value); }}>
        <DialogContent showCloseButton={!updateMutation.isPending} className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogTitle>Modificar solicitud pendiente</DialogTitle>

          <DialogDescription>
            Selecciona tus áreas técnicas y tipos de orientación.
            Conservarás tu fecha original de solicitud.
          </DialogDescription>

          {isTechnicalAreasLoading || isOrientationTypesLoading ? (
            <p className="text-sm">Cargando preferencias...</p>
          ) : (
            <div className="space-y-5">
              <fieldset className="space-y-3">
                <legend className="font-semibold text-ink">
                  Áreas técnicas
                </legend>

                {technicalAreas.map((area) => (
                  <Label
                    key={area.id}
                    className="flex cursor-pointer items-center gap-3 text-sm text-ink"
                  >
                    <Checkbox
                      checked={selectedAreas.includes(area.id)}
                      disabled={updateMutation.isPending}
                      onCheckedChange={() =>
                        toggleId(
                          area.id,
                          selectedAreas,
                          setSelectedAreas,
                        )
                      }
                    />
                    {area.name}
                  </Label>
                ))}
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="font-semibold text-ink">
                  Tipos de orientación
                </legend>

                {orientationTypes.map((orientation) => (
                  <Label
                    key={orientation.id}
                    className="flex cursor-pointer items-center gap-3 text-sm text-ink"
                  >
                    <Checkbox
                      checked={selectedOrientations.includes(orientation.id)}
                      disabled={updateMutation.isPending}
                      onCheckedChange={() =>
                        toggleId(
                          orientation.id,
                          selectedOrientations,
                          setSelectedOrientations,
                        )
                      }
                    />
                    {orientation.name}
                  </Label>
                ))}
              </fieldset>
            </div>
          )}

          {updateMutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {participationErrorMessage(updateMutation.error)}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="outline"
              disabled={updateMutation.isPending}
              onClick={() => setEditOpen(false)}
            >
              Volver
            </Button>

            <Button
              disabled={
                updateMutation.isPending ||
                selectedAreas.length === 0 ||
                selectedOrientations.length === 0 ||
                isTechnicalAreasLoading ||
                isOrientationTypesLoading
              }
              onClick={() => void runOperation(() => updateMutation.mutateAsync())}
            >
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  );
}
