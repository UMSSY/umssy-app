import { describe, expect, it } from "vitest";
import { getStatusOptions } from "./get-status-options";

describe("getStatusOptions", () => {
  it("includes the Retirada option when the withdrawn applications are shown", () => {
    expect(getStatusOptions(true).map((option) => option.value)).toEqual([
      "all",
      "En revisión",
      "Entrevista",
      "Aceptada",
      "No seleccionado",
      "Retirada",
    ]);
  });

  it("leaves the Retirada option out when the withdrawn applications are hidden", () => {
    expect(getStatusOptions(false).map((option) => option.value)).toEqual([
      "all",
      "En revisión",
      "Entrevista",
      "Aceptada",
      "No seleccionado",
    ]);
  });
});
