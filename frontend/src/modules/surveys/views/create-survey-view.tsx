"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SurveyForm } from "../components/survey-form";
import { useIsClient } from "../hooks/use-is-client";
import type { CreateSurveyViewProps } from "../types/create-survey-view-props.types";
import { readSurveyFormDraft } from "../utils/survey-form-draft-storage";
import { createEmptySurveyFormValues, toSurveyFormValues } from "../utils/survey-form-reducer";

export function CreateSurveyView({ resume = false }: CreateSurveyViewProps) {
  const isClient = useIsClient();
  const initial = useMemo(() => {
    if (!isClient) return null;
    const draft = resume ? readSurveyFormDraft() : null;
    // Solo se retoma aquí un avance de encuesta nueva; el de un borrador existente se retoma desde su edición.
    if (draft && draft.surveyId === null) return { values: toSurveyFormValues(draft.values), startsDirty: true };
    return { values: createEmptySurveyFormValues(), startsDirty: false };
  }, [isClient, resume]);

  if (!initial) return <Skeleton className="mx-auto h-96 w-full max-w-4xl" />;

  return <SurveyForm surveyId={null} initialValues={initial.values} startsDirty={initial.startsDirty} />;
}
