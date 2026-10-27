
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/contexts/auth-context";
import { apiClient, isApiError } from "@/shared/services/api-client";
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

type ParticipationRequest = {
  id: string;
  status: string;
  queuedAt: string;
  technicalAreaIds: string[];
  orientationTypeIds: string[];
};

type ParticipationResponse = {
  statusCode: number;
  ok: boolean;
  detail: string;
  data: ParticipationRequest;
};

function extractErrorMessage(error: unknown): string | null {
  if (!isApiError(error)) return null;

  const body = error.response?.data;

  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;

  if (typeof record.detail === "string" && record.detail) {
    return record.detail;
  }

  if (typeof record.message === "string" && record.message) {
    return record.message;
  }

  if (
    Array.isArray(record.message) &&
    record.message.every((item) => typeof item === "string")
  ) {
    return record.message.join(". ");
  }

  return null;
}

export function MentorshipView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refreshRoles } = useAuth();

  const {
    currentStep,
    selectedTechnicalAreaIds,
    wantsToParticipate,
    selectedOrientationTypeIds,
    goNext,
    goBack,
    goToStep,
    toggleTechnicalArea,
    canGoBack,
    canGoNext,
    setState,
  } = useMentorshipWizard();

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
    setState((previous) => ({
      ...previous,
      wantsToParticipate: value,
    }));
  };

  const handleOrientationChange = (ids: string[]) => {
    setState((previous) => ({
      ...previous,
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
    if (isActivating || !wantsToParticipate) return;

    if (
      selectedTechnicalAreaIds.length === 0 ||
      selectedOrientationTypeIds.length === 0
    ) {
      setActivationError(
        "Selecciona al menos un área técnica y un tipo de orientación.",
      );
      return;
    }

    setIsActivating(true);
    setActivationError(null);

    const payload = {
      technicalAreaIds: selectedTechnicalAreaIds,
      orientationTypeIds: selectedOrientationTypeIds,
    };

    try {
      await apiClient.post<ParticipationResponse>(
        "/mentor-participation/requests",
        payload,
      );

      clearMentorshipWizardDraft();

      await queryClient.invalidateQueries({
        queryKey: ["mentors", "participation"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["mentor-participation-requests"],
      });

      router.push("/mentors/participation");
      return;
    } catch (error) {
      if (isApiError(error) && error.response?.status === 409) {
        try {
          await activateMentor(payload);
          await refreshRoles();

          clearMentorshipWizardDraft();
          setIsActivated(true);

          await queryClient.invalidateQueries({
            queryKey: ["mentors", "participation"],
          });

          router.push("/mentors/participation");
          return;
        } catch (activationFailure) {
          setActivationError(
            extractErrorMessage(activationFailure) ??
              "Hay cupos disponibles, pero no se pudo activar tu participación.",
          );
          return;
        }
      }

      if (isApiError(error)) {
        const status = error.response?.status;
        const message = extractErrorMessage(error);

        if (status === 400) {
          setActivationError(
            message ??
              "Las preferencias seleccionadas no son válidas.",
          );
        } else if (status === 401) {
          setActivationError(
            "Tu sesión ya no es válida. Inicia sesión nuevamente.",
          );
        } else if (status === 403) {
          setActivationError(
            message ??
              "No cumples los requisitos para solicitar participación como mentor.",
          );
        } else if (status === 429) {
          setActivationError(
            message ??
              "Has superado el límite de cuatro intentos en 24 horas. Tu participación está bloqueada temporalmente durante 72 horas.",
          );
        } else {
          setActivationError(
            message ??
              "No se pudo procesar tu solicitud. Intenta nuevamente.",
          );
        }
      } else {
        setActivationError(
          "No fue posible conectar con el servidor. Comprueba tu conexión e intenta nuevamente.",
        );
      }
    } finally {
      setIsActivating(false);
    }
  };

  if (isActivated) {
    return (
      <MentorshipActivatedSummary
        technicalAreaNames={selectedTechnicalAreas.map(
          (area) => area.name,
        )}
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
          <div className="space-y-3">
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
          <div className="space-y-3">
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
    </MentorshipWizardShell>
  );
}
