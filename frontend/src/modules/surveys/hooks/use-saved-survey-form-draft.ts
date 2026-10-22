"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { readLocalStorage } from "@/shared/services/storage/browser-local-storage";
import { SURVEY_FORM_DRAFT_STORAGE_KEY } from "../constants/surveys.constants";
import { clearSurveyFormDraft, readSurveyFormDraft } from "../utils/survey-form-draft-storage";

const DRAFT_CHANGE_EVENT = "umssy:survey-form-draft-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(DRAFT_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(DRAFT_CHANGE_EVENT, onChange);
  };
}

const getSnapshot = () => readLocalStorage(SURVEY_FORM_DRAFT_STORAGE_KEY);
const getServerSnapshot = () => null;

// Avance de una encuesta sin publicar guardado en el navegador (opción "retomar" del historial).
export function useSavedSurveyFormDraft() {
  // Se observa el texto guardado y no el objeto, porque el texto se puede comparar entre renders.
  const storedDraft = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const draft = useMemo(() => (storedDraft ? readSurveyFormDraft() : null), [storedDraft]);

  const discard = useCallback(() => {
    clearSurveyFormDraft();
    window.dispatchEvent(new Event(DRAFT_CHANGE_EVENT));
  }, []);

  return { draft, discard };
}
