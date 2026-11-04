"use client";

import { useEffect, useState } from "react";
import { SURVEY_EDIT_DRAFT_BASE_STORAGE_KEY, SURVEY_EDIT_DRAFT_STORAGE_KEY } from "../constants/survey-builder.constants";
import type { RestoredSurveyDraft, SurveyBuilderState } from "../types/survey-builder.types";
import { createSurveyDraftFingerprint } from "../utils/create-survey-draft-fingerprint";
import { readSurveyDraft } from "../utils/read-survey-draft";
import { readSurveyStorage, removeSurveyStorage, writeSurveyStorage } from "../utils/survey-draft-storage";

export function useEditSurveyDraft(surveyId: string, serverState?: SurveyBuilderState) {
  const [restored, setRestored] = useState<RestoredSurveyDraft>();
  const serverFingerprint = serverState ? createSurveyDraftFingerprint(serverState) : null;
  const isRestored = restored?.surveyId === surveyId;

  useEffect(() => {
    if (!serverFingerprint) return;
    let isActive = true;
    const draftKey = SURVEY_EDIT_DRAFT_STORAGE_KEY(surveyId);
    const baseKey = SURVEY_EDIT_DRAFT_BASE_STORAGE_KEY(surveyId);

    void Promise.all([readSurveyDraft(draftKey), readSurveyStorage<string>(baseKey)]).then(
      async ([storedDraft, storedFingerprint]) => {
        if (isRestored) {
          await writeSurveyStorage(baseKey, serverFingerprint);
          return;
        }
        const isDraftCurrent = Boolean(storedDraft) && storedFingerprint === serverFingerprint;
        if (!isDraftCurrent) {
          await removeSurveyStorage(draftKey);
          await writeSurveyStorage(baseKey, serverFingerprint);
        }
        if (isActive) setRestored({ surveyId, draft: isDraftCurrent ? storedDraft : undefined });
      },
    );

    return () => {
      isActive = false;
    };
  }, [surveyId, serverFingerprint, isRestored]);

  return { draft: isRestored ? restored.draft : undefined, isRestored };
}
