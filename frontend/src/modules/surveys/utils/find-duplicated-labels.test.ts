import { describe, expect, it } from "vitest";
import { hasDuplicatedLabels, normalizeLabel } from "./find-duplicated-labels";

describe("find-duplicated-labels", () => {
  it("normaliza con trim y minúsculas", () => {
    expect(normalizeLabel("  Sí ")).toBe("sí");
  });

  it("detecta etiquetas repetidas e ignora las vacías", () => {
    expect(hasDuplicatedLabels(["Sí", " sí"])).toBe(true);
    expect(hasDuplicatedLabels(["Sí", "No", "", ""])).toBe(false);
  });
});
