"use client";

import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { INITIAL_MENTORSHIP_WIZARD_STATE } from "../constants/mentorship-wizard.constants";
import {
  loadMentorshipWizardDraft,
  saveMentorshipWizardDraft,
} from "../services/mentorship-wizard-draft.service";
import type { MentorshipStep } from "../types/mentorship-step.types";
import type { MentorshipWizardState } from "../types/mentorship-wizard-state.types";

export function useMentorshipWizard() {
  const [state, setState] = useState<MentorshipWizardState>(
    INITIAL_MENTORSHIP_WIZARD_STATE,
  );
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);
  const [hasDraftStorageError, setHasDraftStorageError] = useState(false);
  const hasUserEdited = useRef(false);
  const hasDraftLoadFailed = useRef(false);

  const updateState = useCallback((update: SetStateAction<MentorshipWizardState>) => {
    hasUserEdited.current = true;
    setState(update);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void loadMentorshipWizardDraft().then((draft) => {
      if (!isMounted) {
        return;
      }

      if (draft && !hasUserEdited.current) {
        setState(draft);
      }

      setIsDraftHydrated(true);
    }).catch(() => {
      if (isMounted) {
        hasDraftLoadFailed.current = true;
        setHasDraftStorageError(true);
        setIsDraftHydrated(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isDraftHydrated || (hasDraftLoadFailed.current && !hasUserEdited.current)) {
      return;
    }

    let isActive = true;
    void saveMentorshipWizardDraft(state).then(() => {
      if (isActive) setHasDraftStorageError(false);
    }).catch(() => {
      if (isActive) setHasDraftStorageError(true);
    });
    return () => { isActive = false; };
  }, [isDraftHydrated, state]);

  const goToStep = useCallback((step: MentorshipStep) => {
    updateState((prev) => ({
      ...prev,
      currentStep: step,
    }));
  }, [updateState]);

  const goNext = useCallback(() => {
    updateState((prev) => {
      if (prev.currentStep >= 4) return prev;

      return {
        ...prev,
        currentStep: (prev.currentStep + 1) as MentorshipStep,
      };
    });
  }, [updateState]);

  const goBack = useCallback(() => {
    updateState((prev) => {
      if (prev.currentStep <= 1) return prev;

      return {
        ...prev,
        currentStep: (prev.currentStep - 1) as MentorshipStep,
      };
    });
  }, [updateState]);

  const toggleTechnicalArea = useCallback((id: string) => {
    updateState((prev) => {
      const alreadySelected =
        prev.selectedTechnicalAreaIds.includes(id);

      const selectedTechnicalAreaIds = alreadySelected
        ? prev.selectedTechnicalAreaIds.filter(
            (areaId) => areaId !== id,
          )
        : [...prev.selectedTechnicalAreaIds, id];

      return {
        ...prev,
        selectedTechnicalAreaIds,
      };
    });
  }, [updateState]);

  const canGoNextFromStep2 =
    state.selectedTechnicalAreaIds.length > 0;

  const canGoNextFromStep3 =
    state.selectedOrientationTypeIds.length > 0;

  return {
    ...state,
    goToStep,
    goNext,
    goBack,
    toggleTechnicalArea,
    hasDraftStorageError,
    canGoBack: state.currentStep > 1,
    canGoNext:
      state.currentStep === 2
        ? canGoNextFromStep2
        : state.currentStep === 3
          ? canGoNextFromStep3
          : state.currentStep < 4,
    setState: updateState,
  };
}
