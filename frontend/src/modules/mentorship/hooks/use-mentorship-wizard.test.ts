import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  readIndexedDb,
  removeIndexedDb,
  writeIndexedDb,
} from "@/shared/services/storage/browser-indexed-db";
import {
  getMentorshipWizardDraftStorageKey,
  saveMentorshipWizardDraft,
} from "../services/mentorship-wizard-draft.service";
import type { MentorshipWizardState } from "../types/mentorship-wizard-state.types";
import { useMentorshipWizard } from "./use-mentorship-wizard";

const records = vi.hoisted(() => new Map<string, unknown>());

vi.mock("@/shared/services/storage/browser-indexed-db", () => ({
  readIndexedDb: vi.fn(),
  writeIndexedDb: vi.fn(),
  removeIndexedDb: vi.fn(),
}));

const USER_A = "user-a";
const USER_B = "user-b";

function keyFor(userId: string) {
  return getMentorshipWizardDraftStorageKey(userId);
}

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

describe("useMentorshipWizard", () => {
  it("keeps current selections when IndexedDB cannot save and retries on the next edit", async () => {
    vi.mocked(writeIndexedDb).mockRejectedValueOnce(
      new Error("IndexedDB no está disponible"),
    );
    const { result } = renderHook(() => useMentorshipWizard(USER_A));
    await waitFor(() => expect(result.current.hasDraftStorageError).toBe(true));
    act(() => result.current.setState({
      currentStep: 2,
      wantsToParticipate: true,
      selectedTechnicalAreaIds: ["technical-area-1"],
      selectedOrientationTypeIds: [],
    }));
    expect(result.current.selectedTechnicalAreaIds).toEqual(["technical-area-1"]);
    await waitFor(() => expect(
      (records.get(keyFor(USER_A)) as { currentStep: number }).currentStep,
    ).toBe(2));
    await waitFor(() => expect(result.current.hasDraftStorageError).toBe(false));
  });

  it("does not overwrite a draft after a failed read", async () => {
    vi.mocked(readIndexedDb).mockRejectedValueOnce(new Error("Lectura fallida"));
    const { result } = renderHook(() => useMentorshipWizard(USER_A));
    await waitFor(() => expect(result.current.hasDraftStorageError).toBe(true));
    expect(records.has(keyFor(USER_A))).toBe(false);
    act(() => result.current.toggleTechnicalArea("technical-area-1"));
    await waitFor(() => expect(
      (records.get(keyFor(USER_A)) as MentorshipWizardState)
        .selectedTechnicalAreaIds,
    ).toEqual(["technical-area-1"]));
  });

  it("hydrates a stored draft before persisting later changes", async () => {
    const draft: MentorshipWizardState = {
      currentStep: 3,
      wantsToParticipate: true,
      selectedTechnicalAreaIds: ["technical-area-1"],
      selectedOrientationTypeIds: ["orientation-type-1"],
    };
    await saveMentorshipWizardDraft(USER_A, draft);
    const { result } = renderHook(() => useMentorshipWizard(USER_A));
    await waitFor(() => expect(result.current.currentStep).toBe(3));
    expect(result.current.selectedTechnicalAreaIds).toEqual(["technical-area-1"]);
    act(() => result.current.goNext());
    await waitFor(() => expect(
      (records.get(keyFor(USER_A)) as MentorshipWizardState).currentStep,
    ).toBe(4));
  });

  it("preserves every selection after A returns", async () => {
    const draftA: MentorshipWizardState = {
      currentStep: 4,
      wantsToParticipate: true,
      selectedTechnicalAreaIds: ["technical-area-a"],
      selectedOrientationTypeIds: ["orientation-type-a"],
    };
    await saveMentorshipWizardDraft(USER_A, draftA);
    const { result, rerender } = renderHook(
      ({ userId }: { userId: string }) => useMentorshipWizard(userId),
      { initialProps: { userId: USER_A } },
    );
    await waitFor(() => expect(result.current.currentStep).toBe(4));

    rerender({ userId: USER_B });
    expect(result.current.currentStep).toBe(1);
    expect(result.current.selectedTechnicalAreaIds).toEqual([]);
    act(() => result.current.setState({
      currentStep: 2,
      wantsToParticipate: true,
      selectedTechnicalAreaIds: ["technical-area-b"],
      selectedOrientationTypeIds: [],
    }));
    await waitFor(() => expect(
      (records.get(keyFor(USER_B)) as MentorshipWizardState)
        .selectedTechnicalAreaIds,
    ).toEqual(["technical-area-b"]));
    expect(records.get(keyFor(USER_A))).toEqual(draftA);

    rerender({ userId: USER_A });
    await waitFor(() => expect(result.current.currentStep).toBe(4));
    expect(result.current.selectedTechnicalAreaIds).toEqual(["technical-area-a"]);
    expect(result.current.selectedOrientationTypeIds).toEqual(["orientation-type-a"]);
  });

  it("ignores A's delayed hydration after a rapid switch to B", async () => {
    const draftA: MentorshipWizardState = {
      currentStep: 4,
      wantsToParticipate: true,
      selectedTechnicalAreaIds: ["technical-area-a"],
      selectedOrientationTypeIds: ["orientation-type-a"],
    };
    let resolveA!: (value: unknown) => void;
    const delayedA = new Promise<unknown>((resolve) => {
      resolveA = resolve;
    });
    vi.mocked(readIndexedDb).mockImplementation(async (key: string) => {
      if (key === keyFor(USER_A)) return delayedA;
      return records.get(key) ?? null;
    });
    const { result, rerender } = renderHook(
      ({ userId }: { userId: string }) => useMentorshipWizard(userId),
      { initialProps: { userId: USER_A } },
    );
    await waitFor(() => expect(readIndexedDb).toHaveBeenCalledWith(keyFor(USER_A)));

    rerender({ userId: USER_B });
    expect(result.current.currentStep).toBe(1);
    await waitFor(() => expect(records.has(keyFor(USER_B))).toBe(true));
    await act(async () => {
      resolveA(draftA);
      await delayedA;
    });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.selectedTechnicalAreaIds).toEqual([]);
    expect(records.get(keyFor(USER_B))).toEqual({
      currentStep: 1,
      wantsToParticipate: false,
      selectedTechnicalAreaIds: [],
      selectedOrientationTypeIds: [],
    });
  });
});
