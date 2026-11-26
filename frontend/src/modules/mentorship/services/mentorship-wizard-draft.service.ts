import { removeLocalStorage } from "@/shared/services/storage/browser-local-storage";
import { readIndexedDb, writeIndexedDb, removeIndexedDb } from "@/shared/services/storage/browser-indexed-db";

import type { MentorshipWizardState } from "../types/mentorship-wizard-state.types";

const pendingOperations = new Map<string, Promise<unknown>>();

export function getMentorshipWizardDraftStorageKey(userId: string): string {
  if (!userId) throw new Error("Se requiere un identificador de usuario.");
  return `umssy-mentorship-wizard-draft:${encodeURIComponent(userId)}`;
}

function enqueueStorageOperation<T>(
  storageKey: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = pendingOperations.get(storageKey) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(operation);
  pendingOperations.set(storageKey, next);
  void next.finally(() => {
    if (pendingOperations.get(storageKey) === next) {
      pendingOperations.delete(storageKey);
    }
  }).catch(() => {});
  return next;
}

async function discardUnownedLegacyDraft(): Promise<void> {
  removeLocalStorage("umssy-mentorship-wizard-draft");
  await removeIndexedDb("umssy-mentorship-wizard-draft");
}

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
  userId: string,
  state: MentorshipWizardState,
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getMentorshipWizardDraftStorageKey(userId);
  await enqueueStorageOperation(storageKey, () =>
    writeIndexedDb(storageKey, state),
  );
}

export async function loadMentorshipWizardDraft(
  userId: string,
): Promise<MentorshipWizardState | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const storageKey = getMentorshipWizardDraftStorageKey(userId);
  return enqueueStorageOperation(storageKey, async () => {
    await discardUnownedLegacyDraft();
    const saved = await readIndexedDb<unknown>(storageKey);
    if (isMentorshipWizardState(saved)) return saved;
    if (saved !== null) await removeIndexedDb(storageKey);
    return null;
  });
}

export async function clearMentorshipWizardDraft(userId: string): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getMentorshipWizardDraftStorageKey(userId);
  await enqueueStorageOperation(storageKey, () => removeIndexedDb(storageKey));
}
