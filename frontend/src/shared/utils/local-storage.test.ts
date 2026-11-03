import { afterEach, describe, expect, it } from "vitest";
import { readLocalStorage, removeLocalStorage, writeLocalStorage } from "./local-storage";

const KEY = "test-key";

afterEach(() => {
  window.localStorage.clear();
});

describe("local-storage utils", () => {
  it("writes and reads a serialized value", () => {
    writeLocalStorage(KEY, { answer: ["a"] });
    expect(readLocalStorage<{ answer: string[] }>(KEY)).toEqual({ answer: ["a"] });
  });

  it("returns null when the key does not exist", () => {
    expect(readLocalStorage(KEY)).toBeNull();
  });

  it("returns null when the stored value is not valid JSON", () => {
    window.localStorage.setItem(KEY, "{invalid");
    expect(readLocalStorage(KEY)).toBeNull();
  });

  it("removes a stored value", () => {
    writeLocalStorage(KEY, "value");
    removeLocalStorage(KEY);
    expect(readLocalStorage(KEY)).toBeNull();
  });
});
