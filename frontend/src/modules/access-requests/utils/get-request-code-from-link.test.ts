import { describe, expect, it } from "vitest";
import { getRequestCodeFromLink } from "./get-request-code-from-link";

describe("getRequestCodeFromLink", () => {
  it.each([
    undefined,
    null,
    "",
    "   ",
    [],
    ["SOL-2026-0001"],
    ["SOL-2026-0001", "SOL-2026-0002"],
    "OTRO-2026-0001",
    "SOL-26-0001",
    "SOL-2026-001",
    "SOL-2026-0001/extra",
    "SOL-2026-0001?email=privado@ejemplo.com",
    "<script>alert(1)</script>",
  ].map((value) => ({ value })))("rechaza una identificación ausente, ambigua o inválida: $value", ({ value }) => {
    expect(getRequestCodeFromLink(value)).toBeNull();
  });

  it.each([
    ["SOL-2026-0001", "SOL-2026-0001"],
    ["sol-2026-0001", "SOL-2026-0001"],
    [" SOL-2026-0001 ", "SOL-2026-0001"],
    ["SOL-2026-10000", "SOL-2026-10000"],
  ])("normaliza una identificación válida: %s", (value, expected) => {
    expect(getRequestCodeFromLink(value)).toBe(expected);
  });
});
