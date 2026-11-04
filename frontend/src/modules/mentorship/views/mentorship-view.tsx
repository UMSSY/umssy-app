"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/contexts/auth-context";
import { isApiError } from "@/shared/services/api-client";
import {
  mentorParticipationService,
  participationErrorCode,
  participationErrorMessage,
  SlotUnavailableDialog,
  useParticipation,
} from "@/modules/mentors";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import {
  getAccessToken,
  subscribeAccessToken,
} from "@/shared/services/storage/access-token-storage";
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
  const { currentUserId, refreshRoles } = useAuth();
  const token = useSyncExternalStore(
    subscribeAccessToken,
    getAccessToken,
    () => null,
  );
  const participation = useParticipation(token, "always");
  const request = useQuery({
    queryKey: ["mentor-participation-requests", token],
    queryFn: () => mentorParticipationService.getCurrent(),
    enabled: Boolean(token),
    retry: false,
    refetchOnMount: "always",
  });

  useEffect(() => {
    const recheck = () => {
      void queryClient.invalidateQueries({
        queryKey: ["mentors", "participation", token],
      });
      void queryClient.invalidateQueries({
        queryKey: ["mentor-participation-requests", token],
      });
    };
    window.addEventListener("pageshow", recheck);
    window.addEventListener("popstate", recheck);
    return () => {
      window.removeEventListener("pageshow", recheck);
      window.removeEventListener("popstate", recheck);
    };
  }, [queryClient, token]);

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
    hasDraftStorageError,
    setState,
  } = useMentorshipWizard(currentUserId);

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

  const [verificationError, setVerificationError] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [hasIntakeConflict, setHasIntakeConflict] = useState(false);
  const [unavailableOpen, setUnavailableOpen] = useState(false);
  const [requestRegistered, setRequestRegistered] = useState(false);
  const inFlight = useRef(false);

  const canAdvance = currentStep === 1 ? wantsToParticipate : canGoNext;

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

  // Always read the backend before either intake action, bypassing cached data.
  const verifyBeforeSubmit = async () => {
    try {
      const [state, currentRequest] = await Promise.all([
        mentorParticipationService.getMyParticipation(),
        mentorParticipationService.getCurrent(),
      ]);
      queryClient.setQueryData(["mentors", "participation", token], state);
      queryClient.setQueryData(
        ["mentor-participation-requests", token], currentRequest,
      );
      if (
        state.status === "ACTIVE" ||
        ["PENDING", "OFFERED"].includes(currentRequest?.status ?? "")
      ) {
        setUnavailableOpen(false);
        return false;
      }
      return true;
    } catch {
      setUnavailableOpen(false);
      setVerificationError(true);
      return false;
    }
  };

  const handleActivate = async () => {
    if (
      inFlight.current ||
      !wantsToParticipate ||
      participation.state?.status === "ACTIVE"
    )
      return;

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
    inFlight.current = true;
    setActivationError(null);
    setHasIntakeConflict(false);

    const payload = {
      technicalAreaIds: selectedTechnicalAreaIds,
      orientationTypeIds: selectedOrientationTypeIds,
    };

    try {
      if (!(await verifyBeforeSubmit())) return;
      const capacity = await mentorParticipationService.capacity();
      if (capacity.available < 1) {
        if (!(await verifyBeforeSubmit())) return;
        setUnavailableOpen(true);
        return;
      }
      await activateMentor(payload);
      await Promise.allSettled([
        refreshRoles(),
        queryClient.invalidateQueries({
          queryKey: ["mentors", "participation"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["mentor-participation-requests"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["mentorship", "directory"],
        }),
        queryClient.invalidateQueries({ queryKey: ["mentorship", "profile"] }),
      ]);
      if (currentUserId) {
        await clearMentorshipWizardDraft(currentUserId).catch(() => {});
      }
      setIsActivated(true);
    } catch (error) {
      if (
        [
          "MENTOR_OFFER_CONFIRMATION_REQUIRED",
          "REQUEST_ALREADY_EXISTS",
        ].includes(participationErrorCode(error) ?? "")
      ) {
        if (!(await verifyBeforeSubmit())) return;
        setHasIntakeConflict(true);
        setActivationError(participationErrorMessage(error));
        return;
      }
      if (participationErrorCode(error) === "NO_SLOTS") {
        if (!(await verifyBeforeSubmit())) return;
        setUnavailableOpen(true);
        return;
      }

      if (isApiError(error)) {
        const status = error.response?.status;
        const message = extractErrorMessage(error);

        if (status === 400) {
          setActivationError(
            message ?? "Las preferencias seleccionadas no son válidas.",
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
        } else if (status === 409) {
          setActivationError(
            message ?? "Tu participación como mentor ya está activa.",
          );
        } else if (status === 429) {
          setActivationError(
            message ??
              "Has superado el límite de cuatro intentos en 24 horas. Tu participación está bloqueada temporalmente durante 72 horas.",
          );
        } else {
          setActivationError(
            message ?? "No se pudo procesar tu solicitud. Intenta nuevamente.",
          );
        }
      } else {
        setActivationError(
          "No fue posible conectar con el servidor. Comprueba tu conexión e intenta nuevamente.",
        );
      }
    } finally {
      inFlight.current = false;
      setIsActivating(false);
    }
  };

  const handleRequest = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsActivating(true);
    setActivationError(null);
    try {
      if (!(await verifyBeforeSubmit())) return;
      await mentorParticipationService.create({
        technicalAreaIds: selectedTechnicalAreaIds,
        orientationTypeIds: selectedOrientationTypeIds,
      });
      if (currentUserId) {
        await clearMentorshipWizardDraft(currentUserId).catch(() => {});
      }
      await queryClient.invalidateQueries({
        queryKey: ["mentor-participation-requests"],
      });
      setRequestRegistered(true);
    } catch (error) {
      const code = participationErrorCode(error);
      if (code === "REQUEST_ALREADY_EXISTS") {
        await queryClient.invalidateQueries({
          queryKey: ["mentor-participation-requests"],
        });
        setUnavailableOpen(false);
        router.push("/mentors/participation");
      } else if (code === "CAPACITY_AVAILABLE") {
        setUnavailableOpen(false);
        setActivationError(
          "Se liberó un cupo. Confirma nuevamente la activación para incorporarte como mentor.",
        );
      } else {
        setActivationError(participationErrorMessage(error));
      }
    } finally {
      inFlight.current = false;
      setIsActivating(false);
    }
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

  if (
    !token || participation.isLoading || participation.isFetching ||
    request.isPending || request.isFetching
  )
    return (
      <main role="status" className="p-6">
        Verificando tu participación...
      </main>
    );

  if (verificationError || participation.hasLoadError || request.isError)
    return (
      <main className="mx-auto max-w-4xl space-y-4 p-6">
        <p role="alert">No se pudo verificar tu participación.</p>
        <Button
          type="button"
          onClick={() => {
            setVerificationError(false);
            participation.retry();
            void request.refetch();
          }}
        >
          Reintentar
        </Button>
      </main>
    );

  const blockingStatus = participation.state?.status === "ACTIVE"
    ? "ACTIVE"
    : request.data?.status;
  if (["ACTIVE", "PENDING", "OFFERED"].includes(blockingStatus ?? "")) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 p-6">
        <h1 className="text-2xl font-bold text-ink">
          {blockingStatus === "ACTIVE"
            ? "Ya se encuentra registrado como mentor"
            : blockingStatus === "PENDING"
              ? "Ya tienes una solicitud pendiente"
              : "Ya tienes un cupo ofrecido"}
        </h1>
        <p className="text-text-secondary">
          {blockingStatus === "ACTIVE"
            ? "Tu participación está activa."
            : blockingStatus === "PENDING"
              ? "Ya tienes una solicitud registrada. Revisa su estado en Mi participación."
              : "Revisa y confirma tu oferta de cupo antes de su vencimiento."}
        </p>
        <Link href="/mentors/participation" className={buttonVariants()}>
          {blockingStatus === "OFFERED" ? "Ver mi cupo ofrecido" : "Mi participación"}
        </Link>
      </main>
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
          activationError={unavailableOpen ? null : activationError}
          onEditTechnicalAreas={() => goToStep(2)}
          onEditOrientationTypes={() => goToStep(3)}
          onActivate={handleActivate}
        />
        {hasIntakeConflict && (
          <Link
            href="/mentors/participation"
            className={buttonVariants({ variant: "outline" })}
          >
            Revisar mi solicitud u oferta
          </Link>
        )}
      </>
    );
  };

  return (
    <>
      {hasDraftStorageError && (
        <p
          role="alert"
          className="rounded-lg border border-border bg-surface-soft p-4 text-sm text-text-secondary"
        >
          No se pudo guardar el borrador. Tus selecciones permanecen en esta
          sesión.
        </p>
      )}
      <MentorshipWizardShell
        currentStep={currentStep}
        canGoBack={canGoBack && !isActivating}
        canAdvance={canAdvance && !isActivating}
        onBack={goBack}
        onNext={goNext}
      >
        {renderStepContent()}
      </MentorshipWizardShell>
      <SlotUnavailableDialog
        open={unavailableOpen}
        onOpenChange={(open) => {
          setUnavailableOpen(open);
          setActivationError(null);
          if (!open && requestRegistered) {
            router.push("/mentors/participation?registered=1");
          }
        }}
        isSubmitting={isActivating}
        isRegistered={requestRegistered}
        error={activationError}
        onSubmit={() => void handleRequest()}
      />
    </>
  );
}
