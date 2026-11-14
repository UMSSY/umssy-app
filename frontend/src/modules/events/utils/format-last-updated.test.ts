import { describe, expect, it } from "vitest";
import { formatLastUpdated } from "./format-last-updated";

describe("formatLastUpdated", () => {
  it("formats the saved time in Bolivia time", () => {
    const label = formatLastUpdated("2026-11-13T18:30:00Z");
    expect(label).toMatch(/13/);
    expect(label).toMatch(/2026/);
    expect(label).toMatch(/14:30|2:30/);
  });

  it("returns null for invalid dates", () => {
    expect(formatLastUpdated("ayer")).toBeNull();
  });
});
