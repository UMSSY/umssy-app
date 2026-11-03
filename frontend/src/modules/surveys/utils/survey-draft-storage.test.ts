import { afterEach, describe, expect, it } from "vitest";
import { readSurveyStorage, removeSurveyStorage, writeSurveyStorage } from "./survey-draft-storage";

const KEY = "test-key";

afterEach(() => {
  window.localStorage.clear();
});

describe("survey draft storage", () => {
  it("writes and reads a serialized value", () => {
    writeSurveyStorage(KEY, { answer: ["a"] });
    expect(readSurveyStorage<{ answer: string[] }>(KEY)).toEqual({ answer: ["a"] });
  });

  it("returns null when the key does not exist", () => {
    expect(readSurveyStorage(KEY)).toBeNull();
  });

  it("returns null when the stored value is not valid JSON", () => {
    window.localStorage.setItem(KEY, "{invalid");
    expect(readSurveyStorage(KEY)).toBeNull();
  });

  it("removes a stored value", () => {
    writeSurveyStorage(KEY, "value");
    removeSurveyStorage(KEY);
    expect(readSurveyStorage(KEY)).toBeNull();
  });
});
