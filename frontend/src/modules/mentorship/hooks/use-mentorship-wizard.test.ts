import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY } from "../constants/mentorship-wizard.constants";
import { clearMentorshipWizardDraft, saveMentorshipWizardDraft } from "../services/mentorship-wizard-draft.service";
import { useMentorshipWizard } from "./use-mentorship-wizard";
import { readIndexedDb, writeIndexedDb } from "@/shared/services/storage/browser-indexed-db";

const records = vi.hoisted(() => new Map<string, unknown>());

vi.mock("@/shared/services/storage/browser-indexed-db", () => ({
  readIndexedDb: vi.fn(async (key: string) => records.get(key) ?? null),
  writeIndexedDb: vi.fn(async (key: string, value: unknown) => { records.set(key, value); }),
  removeIndexedDb: vi.fn(async (key: string) => { records.delete(key); }),
}));

afterEach(async () => {
  await clearMentorshipWizardDraft();
  localStorage.clear();
});

describe("useMentorshipWizard", () => {
  it("keeps current selections when IndexedDB cannot save and retries on the next edit", async () => {
    vi.mocked(writeIndexedDb).mockRejectedValueOnce(new Error("IndexedDB no está disponible"));
    const { result } = renderHook(() => useMentorshipWizard());
    await waitFor(() => expect(result.current.hasDraftStorageError).toBe(true));
    act(() => result.current.setState({
      currentStep: 2,
      wantsToParticipate: true,
      selectedTechnicalAreaIds: ["technical-area-1"],
      selectedOrientationTypeIds: [],
    }));
    expect(result.current.selectedTechnicalAreaIds).toEqual(["technical-area-1"]);
    await waitFor(() => expect((records.get(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY) as { currentStep: number }).currentStep).toBe(2));
    await waitFor(() => expect(result.current.hasDraftStorageError).toBe(false));
  });

  it("does not overwrite a draft after a failed read", async () => {
    vi.mocked(readIndexedDb).mockRejectedValueOnce(new Error("Lectura fallida"));
    const { result } = renderHook(() => useMentorshipWizard());
    await waitFor(() => expect(result.current.hasDraftStorageError).toBe(true));
    expect(records.has(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY)).toBe(false);
    act(() => result.current.toggleTechnicalArea("technical-area-1"));
    await waitFor(() => expect((records.get(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY) as { selectedTechnicalAreaIds: string[] }).selectedTechnicalAreaIds).toEqual(["technical-area-1"]));
  });

  it("hydrates a stored draft before persisting later changes", async () => {
    const draft = {
      currentStep: 3 as const,
      wantsToParticipate: true,
      selectedTechnicalAreaIds: ["technical-area-1"],
      selectedOrientationTypeIds: ["orientation-type-1"],
    };
    await saveMentorshipWizardDraft(draft);
    const { result } = renderHook(() => useMentorshipWizard());
    await waitFor(() => expect(result.current.currentStep).toBe(3));
    expect(result.current.selectedTechnicalAreaIds).toEqual(["technical-area-1"]);
    act(() => result.current.goNext());
    await waitFor(() => expect((records.get(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY) as typeof draft).currentStep).toBe(4));
  });

  it("preserves every selection after a simulated reload", async () => {
    const { result, unmount } = renderHook(() => useMentorshipWizard());
    await waitFor(() => expect(records.has(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY)).toBe(true));
    act(() => result.current.setState({
      currentStep: 2,
      wantsToParticipate: true,
      selectedTechnicalAreaIds: ["technical-area-1"],
      selectedOrientationTypeIds: ["orientation-type-1"],
    }));
    await waitFor(() => expect((records.get(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY) as { currentStep: number }).currentStep).toBe(2));
    unmount();
    const remounted = renderHook(() => useMentorshipWizard());
    await waitFor(() => expect(remounted.result.current.currentStep).toBe(2));
    expect(remounted.result.current.wantsToParticipate).toBe(true);
    expect(remounted.result.current.selectedTechnicalAreaIds).toEqual(["technical-area-1"]);
    expect(remounted.result.current.selectedOrientationTypeIds).toEqual(["orientation-type-1"]);
  });
});
