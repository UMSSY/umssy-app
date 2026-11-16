
"use client";

import { toast as notify } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Save } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { useMentorProfileDraft } from "@/modules/mentorship";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";

import { TechnicalAreaCard } from "../components/technical-area-card";
import { useTechnicalAreas } from "../hooks/use-technical-areas";
import { useOrientationConfig } from "@/modules/mentorship/hooks/use-orientation-config";
import { useCurrentUserId } from "@/modules/mentorship/hooks/use-current-user-id";
import { MentorProfilePreview } from "@/modules/mentorship/components/preview/mentor-profile-preview";

export function TechnicalAreasView() {
  const router = useRouter();

  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const {
    areas,
    savedIds,
    isSaving,
    isLoading,
    hasLoadError,
    hasAccessError,
    save,
    retry,
  } = useTechnicalAreas();

  const {
    orientationTypes,
    savedIds: savedOrientationIds,
    isLoading: isOrientationLoading,
    hasLoadError: hasOrientationLoadError,
  } = useOrientationConfig();

  const { currentUserId } = useCurrentUserId();

  const {
    technicalAreaIds: draftIds,
    orientationTypeIds: draftOrientationIds,
    setTechnicalAreaIds: setSelectedIds,
    clearTechnicalAreaIds,
  } = useMentorProfileDraft();

  const selectedIds = draftIds ?? savedIds;
  const selectedOrientationIds =
    draftOrientationIds ?? savedOrientationIds;

  const hasChanges =
    selectedIds.length !== savedIds.length ||
    selectedIds.some((id) => !savedIds.includes(id));

  const hasNoSelection = selectedIds.length === 0;

  const canOpenPreview =
    Boolean(currentUserId) &&
    !isLoading &&
    !hasLoadError &&
    !hasAccessError &&
    !isOrientationLoading &&
    !hasOrientationLoadError;

  const handleToggleArea = (id: string) =>
    setSelectedIds((previous) =>
      (previous ?? savedIds).includes(id)
        ? (previous ?? savedIds).filter((item) => item !== id)
        : [...(previous ?? savedIds), id],
    );

  const showToast = (isError: boolean, text: string) => {
    if (isError) notify.error(text);
    else notify.success(text);
  };

  const handleSubmit = async () => {
    if (!hasChanges || hasNoSelection || hasAccessError || isSaving) return;

    try {
      await save(selectedIds);
      clearTechnicalAreaIds();
      showToast(false, "Áreas técnicas actualizadas correctamente");
    } catch {
      showToast(
        true,
        "No se pudieron guardar los cambios. Intente nuevamente.",
      );
    }
  };

  const handleGoBack = () => {
    if (hasChanges) setIsDiscardModalOpen(true);
    else router.push("/mentors/participation");
  };

  if (isPreviewOpen && currentUserId) {
    return (
      <MentorProfilePreview
        mentorId={currentUserId}
        technicalAreas={areas.filter((area) =>
          selectedIds.includes(area.id)
        )}
        orientationTypes={orientationTypes.filter((orientation) =>
          selectedOrientationIds.includes(orientation.id)
        )}
        onBack={() => setIsPreviewOpen(false)}
      />
    );
  }

  return (
    <WorkspacePage
      title="Editar áreas técnicas"
      description="Indica las áreas en las que puedes brindar orientación."
    >
      {!isLoading &&
        !hasLoadError &&
        !hasAccessError &&
        (hasNoSelection ? (
          <Alert className="mb-4 rounded-lg border border-danger/30 bg-interaction p-3 text-sm text-danger">
            Debe seleccionarse al menos un área para continuar
          </Alert>
        ) : (
          <div className="mb-4 rounded-lg bg-surface-soft p-3 text-sm text-ink-soft">
            {selectedIds.length} seleccionadas
          </div>
        ))}

      {isLoading && (
        <p role="status" aria-live="polite" className="py-8 text-center">
          Cargando áreas técnicas...
        </p>
      )}

      {hasLoadError && (
        <Alert className="flex items-center justify-between gap-4 rounded-lg border border-danger/30 bg-interaction p-4 text-danger">
          <span>No se pudieron cargar las áreas técnicas.</span>
          <Button type="button" variant="outline" onClick={retry}>
            Reintentar
          </Button>
        </Alert>
      )}

      {hasAccessError && (
        <Alert className="space-y-3 rounded-lg border border-border bg-surface-soft p-4 text-ink">
          <p>
            Necesitas una participación activa como mentor para editar áreas
            técnicas.
          </p>
          <Link
            href="/mentors/participation"
            className={buttonVariants({ variant: "outline" })}
          >
            Revisar mi participación
          </Link>
          <Link href="/mentorship" className={buttonVariants()}>
            Iniciar incorporación
          </Link>
        </Alert>
      )}

      {!isLoading && !hasLoadError && !hasAccessError && (
        <fieldset
          disabled={isSaving}
          className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-2"
        >
          {areas.map((area) => (
            <TechnicalAreaCard
              key={area.id}
              area={area}
              isSelected={selectedIds.includes(area.id)}
              onToggle={handleToggleArea}
            />
          ))}
        </fieldset>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          onClick={handleGoBack}
          className="h-auto gap-2 rounded-lg bg-surface-soft px-4 py-2 text-sm font-normal text-ink hover:bg-surface-soft active:translate-y-0"
        >
          <ArrowLeft size={16} /> Volver
        </Button>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPreviewOpen(true)}
            disabled={!canOpenPreview}
            className="h-auto gap-2 rounded-lg px-4 py-2"
          >
            <Eye size={16} /> Vista previa
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
  !hasChanges ||
  hasNoSelection ||
  isSaving ||
  isLoading ||
  hasLoadError ||
  hasAccessError
}
            className="h-auto gap-2 rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-brand-hover active:translate-y-0 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              "Guardando..."
            ) : (
              <>
                <Save size={16} /> Guardar cambios
              </>
            )}
          </Button>
        </div>
      </div>

      <AlertDialog
        open={isDiscardModalOpen}
        onOpenChange={(open, eventDetails) => {
          if (eventDetails.reason === "close-press") {
            setIsDiscardModalOpen(open);
          }
        }}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm gap-0 rounded-lg bg-white p-6 ring-0 sm:max-w-sm">
          <AlertDialogHeader className="place-items-start gap-0 text-left">
            <AlertDialogTitle className="mb-2 text-lg font-bold">
              ¿Descartar cambios?
            </AlertDialogTitle>
            <AlertDialogDescription className="mb-4 text-left text-sm [text-wrap:wrap] text-text-secondary">
              Tienes cambios sin guardar. Si sales, se perderán.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="-mx-0 -mb-0 flex-row justify-end gap-2 rounded-none border-0 bg-transparent p-0">
            <AlertDialogCancel
              onClick={() => setIsDiscardModalOpen(false)}
              className="h-auto rounded-lg px-4 py-2 active:translate-y-0"
            >
              Seguir editando
            </AlertDialogCancel>

            <AlertDialogAction
              type="button"
              onClick={() => {
                clearTechnicalAreaIds();
                router.push("/mentors/participation");
              }}
              className="h-auto rounded-lg bg-critical-action px-4 py-2 text-critical-action-foreground hover:bg-critical-action/90 active:translate-y-0"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspacePage>
  );
}
