import { describe, expect, it } from "vitest";
import { getStatusTabs } from "./get-status-tabs";

describe("getStatusTabs", () => {
  it("includes the Retirada tab when the withdrawn applications are shown", () => {
    expect(getStatusTabs(true).map((tab) => tab.value)).toEqual([
      "all",
      "En revisión",
      "Entrevista",
      "Aceptada",
      "No seleccionado",
      "Retirada",
    ]);
  });

  it("leaves the Retirada tab out when the withdrawn applications are hidden", () => {
    expect(getStatusTabs(false).map((tab) => tab.value)).toEqual([
      "all",
      "En revisión",
      "Entrevista",
      "Aceptada",
      "No seleccionado",
    ]);
  });
});
