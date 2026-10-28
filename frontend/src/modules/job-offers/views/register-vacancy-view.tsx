"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeading } from "@/shared/components/layout";
import { ConfirmDialog } from "../components/confirm-dialog";
import { InformationStep } from "../components/information-step";
import { PreviewStep } from "../components/preview-step";
import { RequirementsStep } from "../components/requirements-step";
import { VacancyStepper } from "../components/vacancy-stepper";
import {
  DISCARD_DIALOG_TEXT,
  EDIT_DISCARD_DIALOG_TEXT,
  EDIT_LEAVE_DIALOG_TEXT,
  EDIT_MESSAGES,
  LEAVE_DIALOG_TEXT,
  RECRUITERS_HOME_ROUTE,
  TOAST_OPTIONS,
} from "../constants/job-offers.constants";
import { useJobOfferForm } from "../hooks/use-job-offer-form";
import { useLeaveGuard } from "../hooks/use-leave-guard";
import { usePublishJobOffer } from "../hooks/use-publish-job-offer";
import type { RegisterVacancyViewProps } from "../types/register-vacancy-view-props.types";
import { getCurrentCompany } from "../utils/get-current-company";

export function RegisterVacancyView({ jobOfferId }: RegisterVacancyViewProps) {
  const isEditMode = !!jobOfferId;
  const company = getCurrentCompany();
  const router = useRouter();
  const discardText = isEditMode ? EDIT_DISCARD_DIALOG_TEXT : DISCARD_DIALOG_TEXT;
  const leaveText = isEditMode ? EDIT_LEAVE_DIALOG_TEXT : LEAVE_DIALOG_TEXT;

  const {
    currentStep,
    conditions,
    errors,
    hasUnsavedChanges,
    isLoading,
    loadError,
    updateField,
    selectModality,
    validateField,
    handleContinue,
    handleRequirementsContinue,
    goBack,
    reset,
  } = useJobOfferForm(jobOfferId);

  // Al guardar una edición se avisa con una notificación y se vuelve al listado de vacantes.
  const publication = usePublishJobOffer(jobOfferId, {
    onSuccess: isEditMode
      ? () => {
          toast.success(EDIT_MESSAGES.success, TOAST_OPTIONS);
          router.push(RECRUITERS_HOME_ROUTE);
        }
      : undefined,
  });
  const leaveGuard = useLeaveGuard(hasUnsavedChanges && !publication.isSuccess);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setIsDiscardDialogOpen(true);
    } else {
      router.push(RECRUITERS_HOME_ROUTE);
    }
  };

  const handleDiscard = () => {
    setIsDiscardDialogOpen(false);
    publication.reset();
    reset();
    router.push(RECRUITERS_HOME_ROUTE);
  };

  const handleFinish = () => {
    publication.reset();
    reset();
  };

  if (isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-7xl items-center justify-center gap-3 py-20 text-sm text-text-secondary" role="status">
        <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-accent" />
        Cargando vacante...
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-7xl space-y-4 py-10" role="alert">
        <p className="text-sm text-ink">{loadError}</p>
        <Link href={RECRUITERS_HOME_ROUTE} className={buttonVariants({ variant: "outline" })}>
          Volver a mi empresa
        </Link>
      </main>
    );
  }

  if (publication.isSuccess && !isEditMode) {
    return (
      <main className="mx-auto w-full max-w-7xl space-y-6">
        <PageHeading title="Vacante publicada" description="La oferta se registró correctamente." />
        <section className="max-w-2xl rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">{conditions.title}</h2>
          <p className="mt-2 text-sm text-text-secondary">{conditions.modality} · {conditions.contractType}</p>
          <div className="mt-6 flex gap-3 border-t border-border pt-5">
            <Link href={RECRUITERS_HOME_ROUTE} className={buttonVariants()}>Volver a mi empresa</Link>
            <Button variant="outline" onClick={handleFinish}>Publicar otra vacante</Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl">
      <PageHeading
        className="mb-6"
        title={isEditMode ? "Editar vacante" : "Publicar vacante"}
        description={isEditMode ? "Actualiza la información, requisitos y revisa la oferta antes de guardarla." : "Define la oferta, agrega los requisitos y revisa la publicación antes de confirmarla."}
      />

      <div className="space-y-6">
        <VacancyStepper currentStep={currentStep} />

        <div key={currentStep} className="animate-in duration-200 fade-in-0 slide-in-from-right-1">
          {currentStep === 1 && (
            <InformationStep
              conditions={conditions}
              errors={errors}
              updateField={updateField}
              selectModality={selectModality}
              validateField={validateField}
              onCancel={handleCancel}
              onContinue={handleContinue}
            />
          )}

          {currentStep === 2 && (
            <RequirementsStep
              conditions={conditions}
              errors={errors}
              updateField={updateField}
              onPrevious={goBack}
              onContinue={handleRequirementsContinue}
            />
          )}

          {currentStep === 3 && (
            <PreviewStep
              conditions={conditions}
              company={company}
              isSubmitting={publication.isSubmitting}
              error={publication.error}
              onPrevious={goBack}
              isEditMode={isEditMode}
              onConfirm={() => void publication.submit(conditions)}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDiscardDialogOpen}
        title={discardText.title}
        description={discardText.description}
        confirmLabel={discardText.confirm}
        cancelLabel={discardText.cancel}
        onConfirm={handleDiscard}
        onCancel={() => setIsDiscardDialogOpen(false)}
      />

      <ConfirmDialog
        isOpen={leaveGuard.isLeaveDialogOpen}
        title={leaveText.title}
        description={leaveText.description}
        confirmLabel={leaveText.confirm}
        cancelLabel={leaveText.cancel}
        onConfirm={leaveGuard.confirmLeave}
        onCancel={leaveGuard.cancelLeave}
      />
    </main>
  );
}
