"use client";

import { useEffect, useState } from "react";
import { clearSurveyLocalDraft, loadSurveyLocalDraft, saveSurveyLocalDraft } from "../services/survey-local-draft.service";
import type { SurveyBuilderState, SurveyLocalDraft } from "../types/survey-builder.types";

// Guarda en el navegador la encuesta en creación y ofrece retomarla al volver.
// Mientras el aviso de retomar está pendiente no se sobrescribe el borrador guardado.
export function useSurveyLocalDraft(state: SurveyBuilderState, isEnabled: boolean, onRestore: (draft: SurveyLocalDraft) => void) {
  const [pendingDraft, setPendingDraft] = useState<SurveyLocalDraft | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!isEnabled) return;
    let isMounted = true;

    queueMicrotask(() => {
      if (!isMounted) return;
      setPendingDraft(loadSurveyLocalDraft());
      setIsHydrated(true);
    });

    return () => {
      isMounted = false;
    };
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled || !isHydrated || pendingDraft || !state.isDirty) return;
    saveSurveyLocalDraft(state);
  }, [isEnabled, isHydrated, pendingDraft, state]);

  const resumeDraft = () => {
    if (!pendingDraft) return;
    onRestore(pendingDraft);
    setPendingDraft(null);
  };

  const discardDraft = () => {
    clearSurveyLocalDraft();
    setPendingDraft(null);
  };

  const clearDraft = () => {
    if (isEnabled) clearSurveyLocalDraft();
  };

  return { pendingDraft, resumeDraft, discardDraft, clearDraft };
}
