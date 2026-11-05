import { afterEach, describe, expect, it, vi } from "vitest";
import { readIndexedDb, writeIndexedDb } from "@/shared/services/storage/browser-indexed-db";
import { readSurveyStorage, removeSurveyStorage, writeSurveyStorage } from "./survey-draft-storage";

const records = vi.hoisted(() => new Map<string, unknown>());

vi.mock("@/shared/services/storage/browser-indexed-db", () => ({
  readIndexedDb: vi.fn(async (key: string) => records.get(key) ?? null),
  writeIndexedDb: vi.fn(async (key: string, value: unknown) => { records.set(key, value); }),
  removeIndexedDb: vi.fn(async (key: string) => { records.delete(key); }),
}));

const KEY = "test-key";

afterEach(() => {
  records.clear();
});

describe("survey draft storage", () => {
  it("writes and reads a stored value", async () => {
    await writeSurveyStorage(KEY, { answer: ["a"] });
    expect(await readSurveyStorage<{ answer: string[] }>(KEY)).toEqual({ answer: ["a"] });
  });

  it("returns null when the key does not exist", async () => {
    expect(await readSurveyStorage(KEY)).toBeNull();
  });

  it("returns null when the storage cannot be read", async () => {
    vi.mocked(readIndexedDb).mockRejectedValueOnce(new Error("IndexedDB no está disponible"));
    expect(await readSurveyStorage(KEY)).toBeNull();
  });

  it("does not fail when the storage cannot be written", async () => {
    vi.mocked(writeIndexedDb).mockRejectedValueOnce(new Error("IndexedDB no está disponible"));
    await expect(writeSurveyStorage(KEY, "value")).resolves.toBeUndefined();
  });

  it("removes a stored value", async () => {
    await writeSurveyStorage(KEY, "value");
    await removeSurveyStorage(KEY);
    expect(await readSurveyStorage(KEY)).toBeNull();
  });

  it("removes the value only after a pending write finishes", async () => {
    let finishWrite!: () => void;
    vi.mocked(writeIndexedDb).mockImplementationOnce(async (key: string, value: unknown) => {
      await new Promise<void>((resolve) => {
        finishWrite = resolve;
      });
      records.set(key, value);
    });

    const writing = writeSurveyStorage(KEY, "value");
    const removing = removeSurveyStorage(KEY);
    await vi.waitFor(() => expect(writeIndexedDb).toHaveBeenCalled());
    finishWrite();
    await Promise.all([writing, removing]);

    expect(records.has(KEY)).toBe(false);
  });
});
