"use client";

import { useState } from "react";
import { useIsHydrated } from "@/shared/hooks/use-is-hydrated";
import { SurveyEditor } from "../components/survey-editor";
import { SURVEY_CREATE_DRAFT_STORAGE_KEY, SURVEY_TEXT } from "../constants/survey-builder.constants";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import { useCreateSurvey } from "../hooks/use-create-survey";
import { readSurveyDraft } from "../utils/read-survey-draft";

export function CreateSurveyView() {
  const { createSurvey, isSaving, pendingStatus } = useCreateSurvey();
  const isHydrated = useIsHydrated();
  const [restoredDraft] = useState(() => readSurveyDraft(SURVEY_CREATE_DRAFT_STORAGE_KEY));

  if (!isHydrated) return null;

  return (
    <SurveyEditor
      title={SURVEY_TEXT.pageTitle}
      initialState={restoredDraft}
      autosaveKey={SURVEY_CREATE_DRAFT_STORAGE_KEY}
      isSaving={isSaving}
      pendingStatus={pendingStatus}
      draftSavedMessage={SURVEY_MESSAGES.draftSaved}
      onSave={createSurvey}
    />
  );
}
