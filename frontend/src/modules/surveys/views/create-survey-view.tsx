"use client";

import { SurveyEditor } from "../components/survey-editor";
import { SURVEY_TEXT } from "../constants/survey-builder.constants";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import { useCreateSurvey } from "../hooks/use-create-survey";

export function CreateSurveyView() {
  const { createSurvey, isSaving, pendingStatus } = useCreateSurvey();

  return (
    <SurveyEditor
      title={SURVEY_TEXT.pageTitle}
      isSaving={isSaving}
      pendingStatus={pendingStatus}
      draftSavedMessage={SURVEY_MESSAGES.draftSaved}
      onSave={createSurvey}
    />
  );
}
