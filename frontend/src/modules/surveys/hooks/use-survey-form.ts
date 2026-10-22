"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { SURVEY_FORM_AUTOSAVE_DELAY_MS } from "../constants/survey-form.constants";
import type { SurveyFormErrors, SurveyFormValues } from "../types/survey-form.types";
import type { SurveyValidationMode } from "../types/survey-validation.types";
import { buildSurveyFormErrors } from "../utils/build-survey-form-errors";
import { writeSurveyFormDraft } from "../utils/survey-form-draft-storage";
import { createSurveyFormState, surveyFormReducer, toSurveyInput } from "../utils/survey-form-reducer";

const NO_ERRORS: SurveyFormErrors = { list: [], byField: {} };

export function useSurveyForm(surveyId: string | null, initialValues: SurveyFormValues, startsDirty = false) {
  const [state, dispatch] = useReducer(surveyFormReducer, initialValues, (values) => createSurveyFormState(values, startsDirty));
  const { values, attemptedMode, isDirty } = state;

  // Guardado automático en el navegador: si se corta internet o se cierra la vista, el avance no se pierde.
  useEffect(() => {
    if (!isDirty) return;
    const timeout = setTimeout(() => writeSurveyFormDraft(surveyId, toSurveyInput(values)), SURVEY_FORM_AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [isDirty, surveyId, values]);

  // Los errores se recalculan en cada cambio, así desaparecen apenas el administrador los corrige.
  const errors = useMemo(
    () => (attemptedMode ? buildSurveyFormErrors(values, attemptedMode) : NO_ERRORS),
    [attemptedMode, values],
  );

  // Marca el intento y responde si el formulario es válido para ese modo.
  const validate = useCallback(
    (mode: SurveyValidationMode) => {
      dispatch({ type: "attempt", mode });
      return buildSurveyFormErrors(values, mode).list.length === 0;
    },
    [values],
  );

  return { state, dispatch, errors, validate };
}
