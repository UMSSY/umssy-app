import { beforeEach, describe, expect, it, vi } from "vitest";
import { MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY } from "../constants/mentorship-wizard.constants";
import type { MentorshipWizardState } from "../types/mentorship-wizard-state.types";
import {
  readIndexedDb,
  removeIndexedDb,
  writeIndexedDb,
} from "@/shared/services/storage/browser-indexed-db";
import {
  clearMentorshipWizardDraft,
  getMentorshipWizardDraftStorageKey,
  loadMentorshipWizardDraft,
  saveMentorshipWizardDraft,
} from "./mentorship-wizard-draft.service";

const records = vi.hoisted(() => new Map<string, unknown>());

vi.mock("@/shared/services/storage/browser-indexed-db", () => ({
  readIndexedDb: vi.fn(),
  writeIndexedDb: vi.fn(),
  removeIndexedDb: vi.fn(),
}));

const USER_A = "user-a";
const USER_B = "user-b";
const validDraft: MentorshipWizardState = {
  currentStep: 3,
  wantsToParticipate: true,
  selectedTechnicalAreaIds: ["area-id"],
  selectedOrientationTypeIds: ["orientation-id"],
};

beforeEach(() => {
  records.clear();
  localStorage.clear();
  vi.mocked(readIndexedDb).mockReset().mockImplementation(
    async (key: string) => records.get(key) ?? null,
  );
  vi.mocked(writeIndexedDb).mockReset().mockImplementation(
    async (key: string, value: unknown) => {
      records.set(key, value);
    },
  );
  vi.mocked(removeIndexedDb).mockReset().mockImplementation(
    async (key: string) => {
      records.delete(key);
    },
  );
});

describe("mentorship wizard draft", () => {
  it("returns null when the user has no draft", async () => {
    expect(await loadMentorshipWizardDraft(USER_A)).toBeNull();
  });

  it.each([1, 2, 3, 4] as const)(
    "preserves a valid user draft at step %i",
    async (currentStep) => {
      const draft = { ...validDraft, currentStep };
      await saveMentorshipWizardDraft(USER_A, draft);
      expect(await loadMentorshipWizardDraft(USER_A)).toEqual(draft);
    },
  );

  it("keeps A and B drafts isolated while either account edits", async () => {
    const draftA = { ...validDraft, currentStep: 4 as const };
    const draftB = {
      ...validDraft,
      currentStep: 2 as const,
      selectedTechnicalAreaIds: ["area-b"],
      selectedOrientationTypeIds: [],
    };
    await Promise.all([
      saveMentorshipWizardDraft(USER_A, draftA),
      saveMentorshipWizardDraft(USER_B, draftB),
    ]);

    const changedB = {
      ...draftB,
      selectedTechnicalAreaIds: ["area-b-2"],
    };
    await saveMentorshipWizardDraft(USER_B, changedB);

    expect(await loadMentorshipWizardDraft(USER_A)).toEqual(draftA);
    expect(await loadMentorshipWizardDraft(USER_B)).toEqual(changedB);
  });

  it("discards an unowned legacy draft instead of assigning it to a user", async () => {
    records.set(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY, validDraft);
    localStorage.setItem(
      MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY,
      JSON.stringify(validDraft),
    );

    expect(await loadMentorshipWizardDraft(USER_A)).toBeNull();
    expect(records.has(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY)).toBe(false);
    expect(localStorage.getItem(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY)).toBeNull();
    expect(
      records.has(getMentorshipWizardDraftStorageKey(USER_A)),
    ).toBe(false);
  });

  it("removes an incompatible draft only for its owner", async () => {
    const keyA = getMentorshipWizardDraftStorageKey(USER_A);
    const keyB = getMentorshipWizardDraftStorageKey(USER_B);
    records.set(keyA, { ...validDraft, currentStep: 5 });
    records.set(keyB, validDraft);

    expect(await loadMentorshipWizardDraft(USER_A)).toBeNull();
    expect(records.has(keyA)).toBe(false);
    expect(records.get(keyB)).toEqual(validDraft);
  });

  it("clears only the completing user's draft", async () => {
    await saveMentorshipWizardDraft(USER_A, validDraft);
    await saveMentorshipWizardDraft(USER_B, validDraft);

    await clearMentorshipWizardDraft(USER_A);

    expect(await loadMentorshipWizardDraft(USER_A)).toBeNull();
    expect(await loadMentorshipWizardDraft(USER_B)).toEqual(validDraft);
  });
});
