"use client";

import Link from "next/link";
import { useMemo } from "react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { SURVEY_SAVE_MESSAGES } from "../constants/survey-form.constants";
import { SURVEYS_BASE_PATH } from "../constants/surveys.constants";
import { SurveyForm } from "../components/survey-form";
import { useIsClient } from "../hooks/use-is-client";
import { useSurveyDetail } from "../hooks/use-survey-detail";
import type { EditSurveyViewProps } from "../types/edit-survey-view-props.types";
import { readSurveyFormDraft } from "../utils/survey-form-draft-storage";
import { canEditSurvey } from "../utils/survey-status";
import { toSurveyFormValues } from "../utils/survey-form-reducer";

export function EditSurveyView({ id, resume = false }: EditSurveyViewProps) {
  const isClient = useIsClient();
  const { survey, isLoading, isError } = useSurveyDetail(id);
  const initial = useMemo(() => {
    if (!isClient || !survey) return null;
    const draft = resume ? readSurveyFormDraft() : null;
    if (draft?.surveyId === id) return { values: toSurveyFormValues(draft.values), startsDirty: true };
    return { values: toSurveyFormValues(survey), startsDirty: false };
  }, [id, isClient, resume, survey]);

  if (isError || (survey && !canEditSurvey(survey.status))) {
    return (
      <WorkspacePage title="Editar encuesta">
        <section role="alert" className="flex flex-col items-start gap-4 rounded-lg border border-border bg-surface p-6">
          <p className="text-sm text-ink">{isError ? SURVEY_SAVE_MESSAGES.loadError : SURVEY_SAVE_MESSAGES.notEditable}</p>
          <Link href={SURVEYS_BASE_PATH} className={cn(buttonVariants({ variant: "outline" }))}>
            Volver al historial
          </Link>
        </section>
      </WorkspacePage>
    );
  }

  if (isLoading || !initial) return <Skeleton className="mx-auto h-96 w-full max-w-4xl" />;

  return <SurveyForm surveyId={id} initialValues={initial.values} startsDirty={initial.startsDirty} />;
}
