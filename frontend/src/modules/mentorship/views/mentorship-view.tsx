"use client";

import { useAuth } from "@/shared/contexts/auth-context";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { SlotUnavailableDialog } from "@/modules/mentors/components/participation/slot-availability-preview";
import { ParticipationOverview } from "@/modules/mentors/components/participation/participation-overview";
import { PendingParticipation } from "@/modules/mentors/components/participation/pending-participation";
import { useSlotRequestPreview } from "@/modules/mentors/hooks/use-slot-request-preview";
import { SlotCancellationFeedback } from "@/modules/mentors/components/participation/slot-cancellation-feedback";
import { isApiError } from "@/shared/services/api-client";

import { Button } from "@/components/ui/button";
import { activateMentor } from "../services/mentor-activation.service";
import { OrientationStep } from "../components/orientation/orientation-step";
import { ParticipationStep } from "../components/participation/participation-step";
import { ConfirmationStep } from "../components/wizard/confirmation-step";
import { MentorshipActivatedSummary } from "../components/wizard/mentorship-activated-summary";
import { MentorshipWizardShell } from "../components/wizard/mentorship-wizard-shell";
import { StepTechnicalAreas } from "../components/wizard/step-technical-areas";
import { useMentorshipCatalogs } from "../hooks/use-mentorship-catalogs";
import { useMentorshipWizard } from "../hooks/use-mentorship-wizard";
import { clearMentorshipWizardDraft } from "../services/mentorship-wizard-draft.service";
import { useParticipation } from "@/modules/mentors/hooks/use-participation";

export function MentorshipView() {
  const slotRequestPreview = useSlotRequestPreview();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAvailabilitySimulation = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_APP_ENV !== "prod";
  const [simulatedSlotsAvailable, setSimulatedSlotsAvailable] = useState(false);
  const [isUnavailableOpen, setIsUnavailableOpen] = useState(false);
  const [isSimulatedActive, setIsSimulatedActive] = useState(false);
  const { refreshRoles } = useAuth();
  const participation = useParticipation();
  const {
    currentStep,
    selectedTechnicalAreaIds,
    wantsToParticipate,
    selectedOrientationTypeIds,
    isDraftHydrated,
    goNext,
    goBack,
    goToStep,
    toggleTechnicalArea,
    canGoBack,
    canGoNext,
    setState,
  } = useMentorshipWizard();

  useEffect(() => {
    const savedParticipation = participation.state;
    if (
      !isDraftHydrated ||
      !savedParticipation ||
      savedParticipation.isActive
    ) {
      return;
    }

    setState((previous) => ({
      ...previous,
      currentStep: 1,
      wantsToParticipate: true,
      selectedTechnicalAreaIds: savedParticipation.technicalAreaIds,
      selectedOrientationTypeIds: savedParticipation.orientationTypeIds,
    }));
  }, [isDraftHydrated, participation.state, setState]);

  const {
    technicalAreas,
    isTechnicalAreasLoading,
    isTechnicalAreasError,
    retryTechnicalAreas,
    orientationTypes,
    isOrientationTypesLoading,
    isOrientationTypesError,
    retryOrientationTypes,
  } = useMentorshipCatalogs();

  const [isActivating, setIsActivating] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

  const canAdvance =
    currentStep === 1 ? wantsToParticipate : canGoNext;

  const handleParticipationChange = (value: boolean) => {
    setState((prev) => ({
      ...prev,
      wantsToParticipate: value,
    }));
  };

  const handleOrientationChange = (ids: string[]) => {
    setState((prev) => ({
      ...prev,
      selectedOrientationTypeIds: ids,
    }));
  };

  const selectedTechnicalAreas = technicalAreas.filter((area) =>
    selectedTechnicalAreaIds.includes(area.id),
  );

  const selectedOrientationTypes = orientationTypes.filter((orientation) =>
    selectedOrientationTypeIds.includes(orientation.id),
  );

  const handleActivate = async () => {
    if (isActivating) {
      return;
    }

    // Both development scenarios are local previews; never persist activation.
    if (isAvailabilitySimulation) {
      if (simulatedSlotsAvailable) {
        setIsSimulatedActive(true);
      } else {
        setIsUnavailableOpen(true);
      }
      return;
    }

    setIsActivating(true);
    setActivationError(null);

    try {
      await activateMentor({
        technicalAreaIds: selectedTechnicalAreaIds,
        orientationTypeIds: selectedOrientationTypeIds,
      });
      await refreshRoles();

      clearMentorshipWizardDraft();
      setIsActivated(true);
      void queryClient.invalidateQueries({ queryKey: ["mentors", "participation"] });
      router.push("/mentors/participation");
    } catch (error) {
      if (isApiError(error)) {
        const status = error.response?.status;

        if (status === 400) {
          setActivationError(
            "La información seleccionada no es válida. Revisa tu configuración e inténtalo nuevamente.",
          );
        } else if (status === 401) {
          setActivationError(
            "Tu sesión ya no es válida. Inicia sesión nuevamente para activar tu participación.",
          );
        } else if (status === 409) {
          setActivationError(
            "Tu participación como mentor ya está activa.",
          );
        } else if (status === 500) {
          setActivationError(
            "Ocurrió un problema en el servidor. Intenta nuevamente más tarde.",
          );
        } else {
          setActivationError(
            "No se pudo activar tu participación. Intenta nuevamente.",
          );
        }
      } else {
        setActivationError(
          "No se pudo activar tu participación. Intenta nuevamente.",
        );
      }
    } finally {
      setIsActivating(false);
    }
  };

  if (slotRequestPreview.request) return <PendingParticipation />;
  if (slotRequestPreview.notice === "cancelled") return <SlotCancellationFeedback />;

  if (isAvailabilitySimulation && isSimulatedActive) {
    return (
      <div className="space-y-6">
        <section aria-label="Activación simulada" className="space-y-3 rounded-lg border border-border bg-surface-soft p-4">
          <p role="status" className="text-sm font-semibold text-ink">Participación activa (simulación de desarrollo)</p>
          <p className="text-sm text-text-secondary">Esta vista es temporal. No se ha activado tu cuenta ni guardado la participación en el servidor. Al recargar se vuelve al formulario.</p>
          <Button variant="outline" onClick={() => setIsSimulatedActive(false)}>Volver al formulario y probar otro escenario</Button>
        </section>
        <ParticipationOverview isActive areas={selectedTechnicalAreas.map((area) => area.name)} orientations={selectedOrientationTypes.map((orientation) => orientation.name)} />
      </div>
    );
  }

  if (isActivated) {
    return (
      <MentorshipActivatedSummary
        technicalAreaNames={selectedTechnicalAreas.map((area) => area.name)}
        orientationLabels={selectedOrientationTypes.map(
          (orientation) => orientation.name,
        )}
      />
    );
  }

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <ParticipationStep
          isParticipating={wantsToParticipate}
          onParticipationChange={handleParticipationChange}
        />
      );
    }

    if (currentStep === 2) {
      if (isTechnicalAreasLoading) {
        return <p>Cargando áreas técnicas...</p>;
      }

      if (isTechnicalAreasError) {
        return (
          <div>
            <p>No se pudieron cargar las áreas técnicas.</p>
            <Button type="button" onClick={retryTechnicalAreas}>
              Reintentar
            </Button>
          </div>
        );
      }

      if (technicalAreas.length === 0) {
        return <p>No hay áreas técnicas disponibles.</p>;
      }

      return (
        <StepTechnicalAreas
          technicalAreas={technicalAreas}
          selectedIds={selectedTechnicalAreaIds}
          onToggle={toggleTechnicalArea}
        />
      );
    }

    if (currentStep === 3) {
      if (isOrientationTypesLoading) {
        return <p>Cargando tipos de orientación...</p>;
      }

      if (isOrientationTypesError) {
        return (
          <div>
            <p>No se pudieron cargar los tipos de orientación.</p>
            <Button type="button" onClick={retryOrientationTypes}>
              Reintentar
            </Button>
          </div>
        );
      }

      if (orientationTypes.length === 0) {
        return <p>No hay tipos de orientación disponibles.</p>;
      }

      return (
        <OrientationStep
          orientationTypes={orientationTypes}
          selectedOrientationTypeIds={selectedOrientationTypeIds}
          onSelectionChange={handleOrientationChange}
        />
      );
    }

    return (
      <>
      {isAvailabilitySimulation && (
        <section aria-label="Simulación de disponibilidad" className="mb-6 space-y-3 rounded-lg border border-border bg-surface-soft p-4">
          <p className="text-sm font-semibold text-ink">Disponibilidad simulada para desarrollo</p>
          <p className="text-xs text-text-secondary">Elige el escenario antes de confirmar. La disponibilidad y la activación son simuladas: ninguna opción activa tu cuenta ni guarda la participación en el servidor.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" aria-pressed={!simulatedSlotsAvailable} onClick={() => setSimulatedSlotsAvailable(false)}>Simular cupos ocupados</Button>
            <Button variant="outline" size="sm" aria-pressed={simulatedSlotsAvailable} onClick={() => setSimulatedSlotsAvailable(true)}>Simular cupos disponibles</Button>
          </div>
          <p role="status" className="text-sm text-accent">{simulatedSlotsAvailable ? "Hay cupos disponibles (simulación)" : "Todos los cupos están ocupados (simulación)"}</p>
        </section>
      )}
      <ConfirmationStep
        wantsToParticipate={wantsToParticipate}
        selectedTechnicalAreas={selectedTechnicalAreas}
        selectedOrientationTypes={selectedOrientationTypes}
        isActivating={isActivating}
        activationError={activationError}
        onEditTechnicalAreas={() => goToStep(2)}
        onEditOrientationTypes={() => goToStep(3)}
        onActivate={handleActivate}
      />
      </>
    );
  };

  return (
    <MentorshipWizardShell
      currentStep={currentStep}
      canGoBack={canGoBack}
      canAdvance={canAdvance}
      onBack={goBack}
      onNext={goNext}
    >
      {renderStepContent()}
      <SlotUnavailableDialog open={isUnavailableOpen} onOpenChange={setIsUnavailableOpen} areas={selectedTechnicalAreas.map((area) => area.name)} orientations={selectedOrientationTypes.map((orientation) => orientation.name)} />
    </MentorshipWizardShell>
  );
}
