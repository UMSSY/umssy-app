"use client";

import { useState } from "react";

export type Modality = "Presencial" | "Remoto" | "Hibrido";

export interface VacancyConditions {
    title: string;
    description: string;
    modality: Modality | null;
    mapsLink: string;
    contractType: string;
    category: string;
    vacancyCount: string;
    salary: string;
    languages: string;
    requirementsDescription: string;  
    skills: string[];
}

export type UpdateVacancyField = <Field extends keyof VacancyConditions>(
    field: Field,
    value: VacancyConditions[Field],
) => void;

const initialConditions: VacancyConditions = {
    title: "",
    description: "",
    modality: null,
    mapsLink: "",
    contractType: "",
    category: "",
    vacancyCount: "",
    salary: "",
    languages: "",
    requirementsDescription: "",  
    skills: [],
};

export function useJobOfferForm() {
    const [currentStep, setCurrentStep] = useState(2);
    const [conditions, setConditions] = useState<VacancyConditions>(initialConditions);

    const updateField: UpdateVacancyField = (field, value) => {
        setConditions((prev) => ({ ...prev, [field]: value }));
    };

    function selectModality(modality: Modality) {
        setConditions((prev) => ({ ...prev, modality }));
    }

    function goNext() {
        setCurrentStep(prev => Math.min(prev + 1, 3));
    }
    
    function goBack() {
        setCurrentStep((step) => Math.max(step - 1, 1));
    }

    return { currentStep, conditions, updateField, selectModality, goNext, goBack };
}
