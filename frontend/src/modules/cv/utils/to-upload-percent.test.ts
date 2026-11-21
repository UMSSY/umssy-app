import { describe, expect, it } from "vitest";
import { toUploadPercent } from "./to-upload-percent";

describe("toUploadPercent", () => {
  it("rounds the uploaded fraction to a percentage", () => {
    expect(toUploadPercent(1, 3)).toBe(33);
    expect(toUploadPercent(512, 1024)).toBe(50);
  });

  it("keeps the value between 0 and 100", () => {
    expect(toUploadPercent(2048, 1024)).toBe(100);
    expect(toUploadPercent(-10, 1024)).toBe(0);
  });

  it("returns null when the total size is unknown", () => {
    expect(toUploadPercent(512, undefined)).toBeNull();
    expect(toUploadPercent(512, 0)).toBeNull();
  });
});
