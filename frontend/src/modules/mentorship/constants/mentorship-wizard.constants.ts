import type { MentorshipWizardState } from "../types/mentorship-wizard-state.types";

export const INITIAL_MENTORSHIP_WIZARD_STATE: MentorshipWizardState = {
  currentStep: 1,
  wantsToParticipate: false,
  selectedTechnicalAreaIds: [],
  selectedOrientationTypeIds: [],
};
