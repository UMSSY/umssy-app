import { describe, expect, it } from "vitest";
import { isSnapshotStale } from "./is-snapshot-stale";

const now = Date.parse("2026-11-14T12:00:00Z");

describe("isSnapshotStale", () => {
  it.each([
    ["2026-11-14T11:00:00Z", false],
    ["2026-11-13T12:00:00Z", false],
    ["2026-11-13T11:59:59Z", true],
    ["fecha inválida", true],
  ])("marks a copy saved at %s as stale: %s", (savedAt, expected) => {
    expect(isSnapshotStale(savedAt, now)).toBe(expected);
  });
});
