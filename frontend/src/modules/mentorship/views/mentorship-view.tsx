"use client";

import { useAuth } from "@/shared/contexts/auth-context";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
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
import { getParticipation, requestParticipation } from "../services/mentor-participation.service";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function MentorshipView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const participation = useQuery({ queryKey: ["mentor-participation", "me"],
    queryFn: ({ signal }) => getParticipation(signal), refetchInterval: 15_000 });
  const sanction = participation.data?.sanction;
  const suspended = Boolean(sanction && new Date(sanction.expiresAt).getTime() > Date.now());
  const sanctionMessage = sanction ? `Las nuevas solicitudes están suspendidas hasta el ${new Intl.DateTimeFormat("es-BO", {
    timeZone: "America/La_Paz", dateStyle: "full", timeStyle: "short",
  }).format(new Date(sanction.expiresAt))} (hora de Bolivia).` : "";
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
  const [noSlotsOpen, setNoSlotsOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState<"created" | "duplicate" | null>(null);

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
    if (isActivating || suspended) {
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
      await queryClient.invalidateQueries({ queryKey: ["mentor-participation"] });

      clearMentorshipWizardDraft();
      setIsActivated(true);
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
          const code = (error.response?.data as { data?: { code?: string } } | undefined)?.data?.code;
          if (code === "NO_SLOTS") {
            setRequestFeedback(null);
            setNoSlotsOpen(true);
          } else {
            setActivationError("Tu participación como mentor ya está activa.");
          }
        } else if (status === 429) {
          await queryClient.invalidateQueries({ queryKey: ["mentor-participation", "me"] });
          setActivationError("Se suspendieron temporalmente las nuevas solicitudes. Consulta la fecha de término en Mi participación.");
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

  const handleRequest = async () => {
    if (isRequesting || suspended) return;
    setIsRequesting(true);
    setActivationError(null);
    try {
      await requestParticipation({ technicalAreaIds: selectedTechnicalAreaIds, orientationTypeIds: selectedOrientationTypeIds });
      clearMentorshipWizardDraft();
      await queryClient.invalidateQueries({ queryKey: ["mentor-participation"] });
      setRequestFeedback("created");
    } catch (error) {
      if (isApiError(error)) {
        const code = (error.response?.data as { data?: { code?: string } } | undefined)?.data?.code;
        if (code === "SLOT_AVAILABLE") {
          setNoSlotsOpen(false);
          setActivationError("Se liberó un cupo. Confirma tu activación en este formulario.");
          return;
        }
        if (code === "DUPLICATE_REQUEST") {
          setRequestFeedback("duplicate");
          return;
        }
        if (code === "MENTOR_REQUEST_SUSPENDED") {
          await queryClient.invalidateQueries({ queryKey: ["mentor-participation", "me"] });
          setNoSlotsOpen(false);
          setActivationError("Se suspendieron temporalmente las nuevas solicitudes. Consulta Mi participación.");
          return;
        }
        const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
        setActivationError(detail ?? "No se pudo registrar la solicitud.");
      } else setActivationError("No se pudo registrar la solicitud.");
    } finally { setIsRequesting(false); }
  };

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
      <ConfirmationStep
        wantsToParticipate={wantsToParticipate}
        selectedTechnicalAreas={selectedTechnicalAreas}
        selectedOrientationTypes={selectedOrientationTypes}
        isActivating={isActivating}
        isSuspended={suspended}
        activationError={activationError}
        onEditTechnicalAreas={() => goToStep(2)}
        onEditOrientationTypes={() => goToStep(3)}
        onActivate={handleActivate}
      />
    );
  };

  return (
    <>
    {suspended && <div role="alert" className="mx-auto max-w-5xl rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <strong>Solicitudes suspendidas temporalmente.</strong> {sanctionMessage} Puedes consultar tus solicitudes y ofertas existentes en <Link className="underline" href="/mentors/participation">Mi participación</Link>.
    </div>}
    <MentorshipWizardShell
      currentStep={currentStep}
      canGoBack={canGoBack}
      canAdvance={canAdvance}
      onBack={goBack}
      onNext={goNext}
    >
      {renderStepContent()}
    </MentorshipWizardShell>
    <AlertDialog open={noSlotsOpen} onOpenChange={(open) => {
      if (!open && !isRequesting) {
        setNoSlotsOpen(false);
        if (requestFeedback) router.push("/mentors/participation");
      }
    }}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader><AlertDialogTitle>No hay cupos disponibles</AlertDialogTitle>
          <AlertDialogDescription>Actualmente todos los cupos para mentores están ocupados. Puedes solicitar un cupo y te avisaremos cuando se libere uno.</AlertDialogDescription></AlertDialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-md bg-muted p-3"><strong>Criterio estricto de asignación institucional (FIFO)</strong><p>Los cupos se asignan por riguroso orden cronológico de solicitud en cuanto se libere uno.</p></div>
          <p>Por confidencialidad institucional, la lista de espera no exhibe números o posiciones relativas.</p>
          {requestFeedback === "created" && <div role="status" className="rounded-md bg-emerald-50 p-3 text-emerald-900"><strong>Solicitud registrada correctamente · Estado: Pendiente</strong><p>Tu postulación ha sido guardada en el sistema. Te avisaremos por la plataforma y al correo institucional cuando se libere un cupo.</p></div>}
          {requestFeedback === "duplicate" && <div role="status" className="rounded-md bg-amber-50 p-3 text-amber-900"><strong>Ya tienes una solicitud pendiente</strong><p>No necesitas solicitar nuevamente. El envío redundante no altera tu posición ni la fecha original.</p></div>}
        </div>
        {activationError && <p role="alert" className="text-sm text-destructive">{activationError}</p>}
        <AlertDialogFooter><AlertDialogCancel disabled={isRequesting}>{requestFeedback ? "Cerrar" : "Cancelar"}</AlertDialogCancel>
          {!requestFeedback && <AlertDialogAction disabled={isRequesting || suspended} onClick={() => { void handleRequest(); }}>{isRequesting ? "Solicitando..." : "Solicitar cupo"}</AlertDialogAction>}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
