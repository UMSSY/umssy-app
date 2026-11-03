"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SurveyEditor } from "../components/survey-editor";
import { SurveyReadOnlyView } from "../components/survey-read-only-view";
import { SURVEY_EDIT_DRAFT_STORAGE_KEY, SURVEY_TEXT } from "../constants/survey-builder.constants";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import { SURVEYS_PATH } from "../constants/survey-routes.constants";
import { useSurveyDetail } from "../hooks/use-survey-detail";
import { useUpdateSurvey } from "../hooks/use-update-survey";
import type { SurveyDetailViewProps } from "../types/survey-component-props.types";
import { readSurveyDraft } from "../utils/read-survey-draft";
import { toSurveyBuilderState } from "../utils/to-survey-builder-state";

export function SurveyDetailView({ id }: SurveyDetailViewProps) {
  const { survey, isLoading, hasError } = useSurveyDetail(id);
  const { updateSurvey, isSaving, pendingStatus } = useUpdateSurvey(id);

  if (isLoading) {
    return (
      <div aria-busy="true" className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (hasError || !survey) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p role="alert" className="text-sm text-danger">
          {SURVEY_MESSAGES.surveyLoadError}
        </p>
        <Link href={SURVEYS_PATH} className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft aria-hidden="true" />
          {SURVEY_TEXT.backToSurveys}
        </Link>
      </div>
    );
  }

  if (survey.status !== "draft") {
    return <SurveyReadOnlyView survey={survey} />;
  }

  const autosaveKey = SURVEY_EDIT_DRAFT_STORAGE_KEY(survey.id);

  return (
    <SurveyEditor
      key={survey.id}
      title={SURVEY_TEXT.editPageTitle}
      initialState={readSurveyDraft(autosaveKey) ?? toSurveyBuilderState(survey)}
      autosaveKey={autosaveKey}
      isSaving={isSaving}
      pendingStatus={pendingStatus}
      draftSavedMessage={SURVEY_MESSAGES.draftUpdated}
      onSave={updateSurvey}
    />
  );
}
