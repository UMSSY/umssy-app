"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmationStep } from "../components/confirmation-step";
import { OrientationStep } from "../components/orientation-step";
import { ParticipationStep } from "../components/participation-step";
import { ProgressStepper } from "../components/progress-stepper";
import { StepTechnicalAreas } from "../components/step-technical-areas";
import { ORIENTATION_TYPES } from "../data/orientation-types";
import { TECHNICAL_AREAS } from "../data/technical-areas";
import { useMentorshipWizard } from "../hooks/use-mentorship-wizard";

export function MentorshipView() {
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

  const [isActivating, setIsActivating] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

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

  const handleActivate = async () => {
    setIsActivating(true);

    // La integración real con la API se realizará en la tarea correspondiente.
    await new Promise((resolve) => setTimeout(resolve, 500));

    window.localStorage.setItem(
      "umssy-mentor-participation",
      JSON.stringify({
        status: "active",
        areas: selectedTechnicalAreas.map((area) => area.name),
        orientations: selectedOrientationTypes.map((orientation) => orientation.label),
      }),
    );

    setIsActivating(false);
    setIsActivated(true);
  };

  const selectedTechnicalAreas = TECHNICAL_AREAS.filter((area) =>
    selectedTechnicalAreaIds.includes(area.id),
  );

  const selectedOrientationTypes = ORIENTATION_TYPES.filter((orientation) =>
    selectedOrientationTypeIds.includes(orientation.id),
  );

  if (isActivated) {
    return (
      <main className="min-h-full bg-surface-soft px-4 py-6 sm:py-8">
        <div className="mx-auto w-full max-w-4xl">
          <section className="rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-6">
            <div className="space-y-6">
              <div>
                <h1 className="font-tight text-xl font-bold text-ink sm:text-2xl">
                  Tu participación como mentor está activa
                </h1>

                <p className="mt-2 text-sm text-text-secondary">
                  Tu configuración fue registrada correctamente.
                </p>
              </div>

              <section className="rounded-lg border border-border bg-surface-soft p-4">
                <h2 className="text-sm font-semibold text-ink">
                  Áreas técnicas
                </h2>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTechnicalAreas.map((area) => (
                    <span
                      key={area.id}
                      className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-ink"
                    >
                      {area.name}
                    </span>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-border bg-surface-soft p-4">
                <h2 className="text-sm font-semibold text-ink">
                  Tipos de orientación
                </h2>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedOrientationTypes.map((orientation) => (
                    <span
                      key={orientation.id}
                      className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-ink"
                    >
                      {orientation.label}
                    </span>
                  ))}
                </div>
              </section>

              <Link
                href="/mentorship/mentors"
                className="block w-full rounded-md bg-accent px-5 py-2.5 text-center text-sm font-semibold text-white"
              >
                Ir al directorio
              </Link>
            </div>
          </section>
        </div>
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
      return (
        <StepTechnicalAreas
          selectedIds={selectedTechnicalAreaIds}
          onToggle={toggleTechnicalArea}
        />
      );
    }

    if (currentStep === 3) {
      return (
        <OrientationStep
          selectedOrientationTypeIds={selectedOrientationTypeIds}
          onSelectionChange={handleOrientationChange}
        />
      );
    }

    return (
      <ConfirmationStep
        wantsToParticipate={wantsToParticipate}
        selectedTechnicalAreaIds={selectedTechnicalAreaIds}
        selectedOrientationTypeIds={selectedOrientationTypeIds}
        isActivating={isActivating}
        onEditTechnicalAreas={() => goToStep(2)}
        onEditOrientationTypes={() => goToStep(3)}
        onActivate={handleActivate}
      />
    );
  };

  return (
    <main className="min-h-full bg-surface-soft px-4 py-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 sm:gap-8">
        <ProgressStepper currentStep={currentStep} />

        <section className="rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-6">
          <header className="mb-6">
            <h1 className="font-tight text-xl font-bold text-ink sm:text-2xl">
              Participa como mentor
            </h1>

            <p className="mt-1 text-sm text-text-secondary">
              Configura tu participación como mentor.
            </p>
          </header>

          <div className="min-h-48 rounded-md border border-border bg-surface-soft p-4 sm:p-6">
            {renderStepContent()}
          </div>

          {currentStep < 4 && (
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={!canGoBack}
                className="rounded-md border border-border-strong px-4 py-2.5 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                ← Volver
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvance}
                className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continuar →
              </button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="mt-6">
              <button
                type="button"
                onClick={goBack}
                className="rounded-md border border-border-strong px-4 py-2.5 text-sm font-semibold text-ink"
              >
                ← Volver
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
