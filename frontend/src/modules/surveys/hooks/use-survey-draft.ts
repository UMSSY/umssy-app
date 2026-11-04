"use client";

import { useEffect, useState } from "react";
import type { SurveyBuilderState } from "../types/survey-builder.types";
import { readSurveyDraft } from "../utils/read-survey-draft";

export function useSurveyDraft(storageKey: string) {
  const [draft, setDraft] = useState<SurveyBuilderState>();
  const [restoredKey, setRestoredKey] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    void readSurveyDraft(storageKey).then((storedDraft) => {
      if (!isActive) return;
      setDraft(storedDraft);
      setRestoredKey(storageKey);
    });
    return () => {
      isActive = false;
    };
  }, [storageKey]);

  const isRestored = restoredKey === storageKey;

  return { draft: isRestored ? draft : undefined, isRestored };
}
