import { readLocalStorage, removeLocalStorage } from "@/shared/services/storage/browser-local-storage";
import { readIndexedDb, writeIndexedDb, removeIndexedDb } from "@/shared/services/storage/browser-indexed-db";
import { MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY } from "../constants/mentorship-wizard.constants";
import type { MentorshipWizardState } from "../types/mentorship-wizard-state.types";

let pendingWrite: Promise<void> = Promise.resolve();

function isMentorshipWizardState(value: unknown): value is MentorshipWizardState {
  if (typeof value !== "object" || value === null) return false;

  const draft = value as Record<string, unknown>;
  return (
    (draft.currentStep === 1 ||
      draft.currentStep === 2 ||
      draft.currentStep === 3 ||
      draft.currentStep === 4) &&
    typeof draft.wantsToParticipate === "boolean" &&
    Array.isArray(draft.selectedTechnicalAreaIds) &&
    draft.selectedTechnicalAreaIds.every((id) => typeof id === "string") &&
    Array.isArray(draft.selectedOrientationTypeIds) &&
    draft.selectedOrientationTypeIds.every((id) => typeof id === "string")
  );
}

export async function saveMentorshipWizardDraft(
  state: MentorshipWizardState,
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  pendingWrite = pendingWrite.catch(() => {}).then(() => writeIndexedDb(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY, state));
  await pendingWrite;
}

export async function loadMentorshipWizardDraft(): Promise<MentorshipWizardState | null> {
  if (typeof window === "undefined") {
    return null;
  }

  await pendingWrite.catch(() => {});
  const saved = await readIndexedDb<unknown>(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY);
  if (isMentorshipWizardState(saved)) return saved;
  if (saved !== null) await removeIndexedDb(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY);
  const stored = readLocalStorage(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY);
  if (stored === null) return null;

  let draft: unknown;
  try {
    draft = JSON.parse(stored);
  } catch {
    removeLocalStorage(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY);
    return null;
  }

  if (isMentorshipWizardState(draft)) {
    await writeIndexedDb(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY, draft);
    removeLocalStorage(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY);
    return draft;
  }

  removeLocalStorage(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY);
  return null;
}

export async function clearMentorshipWizardDraft(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  removeLocalStorage(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY);
  pendingWrite = pendingWrite.catch(() => {}).then(() => removeIndexedDb(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY));
  await pendingWrite;
}
