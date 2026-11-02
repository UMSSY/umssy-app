import { afterEach, describe, expect, it, vi } from "vitest";
import { MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY } from "../constants/mentorship-wizard.constants";
import type { MentorshipWizardState } from "../types/mentorship-wizard-state.types";
import { clearMentorshipWizardDraft, loadMentorshipWizardDraft, saveMentorshipWizardDraft } from "./mentorship-wizard-draft.service";

const records = vi.hoisted(() => new Map<string, unknown>());

vi.mock("@/shared/services/storage/browser-indexed-db", () => ({
  readIndexedDb: vi.fn(async (key: string) => records.get(key) ?? null),
  writeIndexedDb: vi.fn(async (key: string, value: unknown) => { records.set(key, value); }),
  removeIndexedDb: vi.fn(async (key: string) => { records.delete(key); }),
}));

const validDraft: MentorshipWizardState = {
  currentStep: 3,
  wantsToParticipate: true,
  selectedTechnicalAreaIds: ["area-id"],
  selectedOrientationTypeIds: ["orientation-id"],
};

afterEach(async () => {
  await clearMentorshipWizardDraft();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("mentorship wizard draft", () => {
  it("returns null when no draft exists", async () => {
    expect(await loadMentorshipWizardDraft()).toBeNull();
  });

  it.each(["{broken", "", "null", "[]", '"text"', "42", "{}", '{"currentStep":2}'])("removes corrupt legacy JSON: %s", async (stored) => {
    localStorage.setItem(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY, stored);
    expect(await loadMentorshipWizardDraft()).toBeNull();
    expect(localStorage.getItem(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY)).toBeNull();
  });

  it.each([1, 2, 3, 4] as const)("preserves a valid draft at step %i", async (currentStep) => {
    const draft = { ...validDraft, currentStep };
    await saveMentorshipWizardDraft(draft);
    expect(await loadMentorshipWizardDraft()).toEqual(draft);
    expect(localStorage.getItem(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY)).toBeNull();
  });

  it("migrates a valid legacy draft once", async () => {
    localStorage.setItem(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY, JSON.stringify(validDraft));
    expect(await loadMentorshipWizardDraft()).toEqual(validDraft);
    expect(records.get(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY)).toEqual(validDraft);
    expect(localStorage.getItem(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY)).toBeNull();
  });

  it("rejects an incompatible IndexedDB draft", async () => {
    records.set(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY, { ...validDraft, currentStep: 5 });
    expect(await loadMentorshipWizardDraft()).toBeNull();
    expect(records.has(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY)).toBe(false);
  });

  it("clears a saved draft", async () => {
    await saveMentorshipWizardDraft(validDraft);
    await clearMentorshipWizardDraft();
    expect(await loadMentorshipWizardDraft()).toBeNull();
  });
});
