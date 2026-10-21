"use client";

import { useEffect, useState } from "react";
import type {
    Modality,
    UpdateVacancyField,
    VacancyConditions,
    VacancyErrors,
} from "../types/vacancy-conditions.types";
import {
    INFORMATION_FIELDS_ORDER,
    isFieldEmpty,
    validateInformation,
    validateRequirements,
} from "../utils/validate-vacancy";

const REQUIREMENTS_FIELDS_ORDER: (keyof VacancyConditions)[] = ["description", "skills"];

const INITIAL_CONDITIONS: VacancyConditions = {
    title: "",
    modality: null,
    mapsLink: "",
    contractType: "",
    category: "",
    vacancyCount: "",
    salary: "",
    languages: "",
    description: "",
    skills: [],
};

const STEP_PARAM = "paso";
const LAST_STEP = 3;

function readStepFromUrl(): number {
    const step = Number(new URLSearchParams(window.location.search).get(STEP_PARAM));
    return Number.isInteger(step) && step >= 1 && step <= LAST_STEP ? step : 1;
}

function writeStepToUrl(step: number, mode: "push" | "replace") {
    const url = new URL(window.location.href);
    if (step > 1) url.searchParams.set(STEP_PARAM, String(step));
    else url.searchParams.delete(STEP_PARAM);
    if (mode === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
}

function focusField(field: keyof VacancyConditions) {
    const element = document.getElementById(field);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.focus();
}

export function useJobOfferForm() {
    const [currentStep, setCurrentStep] = useState(1);
    const [conditions, setConditions] = useState<VacancyConditions>(INITIAL_CONDITIONS);
    const [errors, setErrors] = useState<VacancyErrors>({});

    useEffect(() => {
        if (readStepFromUrl() > 1) writeStepToUrl(1, "replace");
        const handlePopState = () => setCurrentStep(readStepFromUrl());
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    useEffect(() => {
        if (currentStep > readStepFromUrl()) writeStepToUrl(currentStep, "push");
    }, [currentStep]);

    function clearError(field: keyof VacancyConditions) {
        setErrors((prev) => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }

    const updateField: UpdateVacancyField = (field, value) => {
        setConditions((prev) => ({ ...prev, [field]: value }));
        clearError(field);
    };

    function selectModality(modality: Modality) {
        updateField("modality", modality);
    }

    function validateField(field: keyof VacancyConditions) {
        if (isFieldEmpty(field, conditions)) {
            clearError(field);
            return;
        }
        const message = validateInformation(conditions)[field];
        if (message) {
            setErrors((prev) => ({ ...prev, [field]: message }));
        } else {
            clearError(field);
        }
    }

    function validateMapsLink() {
        validateField("mapsLink");
    }

    function applyStepErrors(
        fields: (keyof VacancyConditions)[],
        found: VacancyErrors,
    ): keyof VacancyConditions | undefined {
        setErrors((prev) => {
            const next = { ...prev };
            fields.forEach((field) => delete next[field]);
            return { ...next, ...found };
        });
        return fields.find((field) => found[field]);
    }

    function goNext() {
        setCurrentStep((step) => Math.min(step + 1, LAST_STEP));
    }

    function goBack() {
        setCurrentStep((step) => Math.max(step - 1, 1));
        if (readStepFromUrl() > 1) window.history.back();
    }

    function handleContinue() {
        const firstInvalid = applyStepErrors(INFORMATION_FIELDS_ORDER, validateInformation(conditions));
        if (firstInvalid) {
            focusField(firstInvalid);
            return;
        }
        goNext();
    }

    function handleRequirementsContinue() {
        const firstInvalid = applyStepErrors(REQUIREMENTS_FIELDS_ORDER, validateRequirements(conditions));
        if (firstInvalid) {
            focusField(firstInvalid);
            return;
        }
        goNext();
    }

    const hasUnsavedChanges = (Object.keys(INITIAL_CONDITIONS) as (keyof VacancyConditions)[]).some(
        (field) => !isFieldEmpty(field, conditions),
    );

    function reset() {
        setConditions(INITIAL_CONDITIONS);
        setErrors({});
        setCurrentStep(1);
        writeStepToUrl(1, "replace");
    }

    return {
        currentStep,
        conditions,
        errors,
        hasUnsavedChanges,
        updateField,
        selectModality,
        validateField,
        validateMapsLink,
        handleContinue,
        handleRequirementsContinue,
        goNext,
        goBack,
        reset,
    };
}
