"use client";

import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { INITIAL_MENTORSHIP_WIZARD_STATE } from "../constants/mentorship-wizard.constants";
import {
  loadMentorshipWizardDraft,
  saveMentorshipWizardDraft,
} from "../services/mentorship-wizard-draft.service";
import type { OwnedWizardState } from "../types/owned-wizard-state.types";
import type { MentorshipStep } from "../types/mentorship-step.types";
import type { MentorshipWizardState } from "../types/mentorship-wizard-state.types";

function createOwnedWizardState(userId: string | null): OwnedWizardState {
  return {
    userId,
    state: INITIAL_MENTORSHIP_WIZARD_STATE,
    isHydrated: false,
    hasUserEdited: false,
    hasDraftLoadFailed: false,
    hasDraftStorageError: false,
  };
}

export function useMentorshipWizard(userId: string | null) {
  const [ownedState, setOwnedState] = useState<OwnedWizardState>(() =>
    createOwnedWizardState(userId),
  );
  const currentOwnedState =
    ownedState.userId === userId
      ? ownedState
      : createOwnedWizardState(userId);
  const state = currentOwnedState.state;

  const updateState = useCallback((update: SetStateAction<MentorshipWizardState>) => {
    setOwnedState((previous) => {
      const current =
        previous.userId === userId
          ? previous
          : createOwnedWizardState(userId);
      return {
        ...current,
        userId,
        state:
          typeof update === "function"
            ? update(current.state)
            : update,
        hasUserEdited: true,
      };
    });
  }, [userId]);

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      return () => {
        isMounted = false;
      };
    }

    void loadMentorshipWizardDraft(userId).then((draft) => {
      if (!isMounted) return;
      setOwnedState((previous) => {
        const current =
          previous.userId === userId
            ? previous
            : createOwnedWizardState(userId);
        return {
          ...current,
          state:
            draft && !current.hasUserEdited
              ? draft
              : current.state,
          isHydrated: true,
          hasDraftLoadFailed: false,
          hasDraftStorageError: false,
        };
      });
    }).catch(() => {
      if (!isMounted) return;
      setOwnedState((previous) => {
        const current =
          previous.userId === userId
            ? previous
            : createOwnedWizardState(userId);
        return {
          ...current,
          isHydrated: true,
          hasDraftLoadFailed: true,
          hasDraftStorageError: true,
        };
      });
    });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (
      !userId ||
      ownedState.userId !== userId ||
      !ownedState.isHydrated ||
      (ownedState.hasDraftLoadFailed && !ownedState.hasUserEdited)
    ) {
      return;
    }

    let isActive = true;
    void saveMentorshipWizardDraft(userId, state).then(() => {
      if (!isActive) return;
      setOwnedState((previous) =>
        previous.userId === userId
          ? { ...previous, hasDraftStorageError: false }
          : previous,
      );
    }).catch(() => {
      if (!isActive) return;
      setOwnedState((previous) =>
        previous.userId === userId
          ? { ...previous, hasDraftStorageError: true }
          : previous,
      );
    });
    return () => { isActive = false; };
  }, [
    ownedState.hasDraftLoadFailed,
    ownedState.hasUserEdited,
    ownedState.isHydrated,
    ownedState.userId,
    state,
    userId,
  ]);

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
    hasDraftStorageError: currentOwnedState.hasDraftStorageError,
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
