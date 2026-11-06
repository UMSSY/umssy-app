"use client";

import { SurveyEditor } from "../components/survey-editor";
import { SURVEY_CREATE_DRAFT_STORAGE_KEY, SURVEY_TEXT } from "../constants/survey-builder.constants";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import { useCreateSurvey } from "../hooks/use-create-survey";
import { useSurveyDraft } from "../hooks/use-survey-draft";

export function CreateSurveyView() {
  const { createSurvey, isSaving, pendingStatus } = useCreateSurvey();
  const { draft, isRestored } = useSurveyDraft(SURVEY_CREATE_DRAFT_STORAGE_KEY);

  if (!isRestored) return null;

  return (
    <SurveyEditor
      title={SURVEY_TEXT.pageTitle}
      initialState={draft}
      autosaveKey={SURVEY_CREATE_DRAFT_STORAGE_KEY}
      isSaving={isSaving}
      pendingStatus={pendingStatus}
      draftSavedMessage={SURVEY_MESSAGES.draftSaved}
      onSave={createSurvey}
    />
  );
}
