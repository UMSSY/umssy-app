"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { SurveyDetailSkeleton } from "../components/survey-detail-skeleton";
import { SurveyEditor } from "../components/survey-editor";
import { SurveyReadOnlyView } from "../components/survey-read-only-view";
import { SURVEY_EDIT_DRAFT_STORAGE_KEY, SURVEY_TEXT } from "../constants/survey-builder.constants";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import { SURVEYS_PATH } from "../constants/survey-routes.constants";
import { useSurveyDetail } from "../hooks/use-survey-detail";
import { useEditSurveyDraft } from "../hooks/use-edit-survey-draft";
import { useUpdateSurvey } from "../hooks/use-update-survey";
import type { SurveyDetailViewProps } from "../types/survey-component-props.types";
import { toSurveyBuilderState } from "../utils/to-survey-builder-state";

export function SurveyDetailView({ id }: SurveyDetailViewProps) {
  const { survey, isLoading, hasError } = useSurveyDetail(id);
  const { updateSurvey, isSaving, pendingStatus } = useUpdateSurvey(id);
  const autosaveKey = SURVEY_EDIT_DRAFT_STORAGE_KEY(id);
  const serverState = survey?.status === "draft" ? toSurveyBuilderState(survey) : undefined;
  const { draft, isRestored } = useEditSurveyDraft(id, serverState);

  if (isLoading) return <SurveyDetailSkeleton />;

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

  if (!isRestored || !serverState) return <SurveyDetailSkeleton />;

  return (
    <SurveyEditor
      key={survey.id}
      title={SURVEY_TEXT.editPageTitle}
      initialState={draft ?? serverState}
      autosaveKey={autosaveKey}
      isSaving={isSaving}
      pendingStatus={pendingStatus}
      draftSavedMessage={SURVEY_MESSAGES.draftUpdated}
      onSave={updateSurvey}
    />
  );
}
