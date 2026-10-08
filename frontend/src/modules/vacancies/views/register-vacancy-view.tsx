"use client";

import { VacancyStepper } from "../components/vacancy-stepper";
import { InformationStep } from "../components/information-step";
import { RequirementsStep } from "../components/requirements-step";
import { PreviewStep } from "../components/preview-step";
import { useJobOfferForm } from "../hooks/use-job-offer-form";

export function RegisterVacancyView() {
    const { 
        currentStep, 
        conditions, 
        errors, 
        updateField, 
        selectModality, 
        validateMapsLink, 
        handleContinue,
        goNext,
        goBack,} = useJobOfferForm();

    return (
        <div className="mx-auto w-full max-w-5xl">
            <h1 className="mb-6 font-tight text-3xl font-extrabold text-ink">Publicar vacante</h1>

            <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
                <VacancyStepper currentStep={currentStep} />

            {currentStep === 1 && (
                <InformationStep 
                    conditions={conditions}
                    errors={errors}
                    updateField={updateField}
                    selectModality={selectModality}
                    validateMapsLink={validateMapsLink}
                    onContinue={handleContinue} 
                />
            )}

            {currentStep === 2 && (
                <RequirementsStep 
                conditions={conditions} 
                updateField={updateField} 
                onPrevious={goBack}
                onContinue={goNext}
                />
            )}

            {currentStep === 3 && (
                <PreviewStep conditions={conditions} onPrevious={goBack} />
            )}
        </div>
        </div>
    );
}