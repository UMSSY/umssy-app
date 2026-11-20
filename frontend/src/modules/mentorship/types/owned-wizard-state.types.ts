import type { MentorshipWizardState } from "./mentorship-wizard-state.types";

export interface OwnedWizardState {
  userId: string | null;
  state: MentorshipWizardState;
  isHydrated: boolean;
  hasUserEdited: boolean;
  hasDraftLoadFailed: boolean;
  hasDraftStorageError: boolean;
}
