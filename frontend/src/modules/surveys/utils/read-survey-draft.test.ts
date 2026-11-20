import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialSurveyState } from "./survey-builder-reducer";
import { readSurveyDraft } from "./read-survey-draft";

const records = vi.hoisted(() => new Map<string, unknown>());

vi.mock("@/shared/services/storage/browser-indexed-db", () => ({
  readIndexedDb: vi.fn(async (key: string) => records.get(key) ?? null),
  writeIndexedDb: vi.fn(async (key: string, value: unknown) => { records.set(key, value); }),
  removeIndexedDb: vi.fn(async (key: string) => { records.delete(key); }),
}));

const KEY = "draft-key";

afterEach(() => {
  records.clear();
});

describe("readSurveyDraft", () => {
  it("returns undefined when there is no stored draft", async () => {
    expect(await readSurveyDraft(KEY)).toBeUndefined();
  });

  it("returns undefined when the stored draft is malformed", async () => {
    records.set(KEY, { title: "Sin preguntas" });
    expect(await readSurveyDraft(KEY)).toBeUndefined();
  });

  it("restores a stored draft as dirty and without pending focus", async () => {
    const state = { ...createInitialSurveyState(), title: "Encuesta", pendingFocus: { questionId: "q1" } };
    records.set(KEY, state);

    expect(await readSurveyDraft(KEY)).toEqual({ ...state, pendingFocus: null, isDirty: true });
  });
});
