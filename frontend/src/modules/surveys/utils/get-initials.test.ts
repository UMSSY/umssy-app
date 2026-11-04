import { describe, expect, it } from "vitest";
import { getInitials } from "./get-initials";

describe("getInitials", () => {
  it("toma la inicial de los dos primeros nombres", () => {
    expect(getInitials("Juan Dávalos")).toBe("JD");
    expect(getInitials("  miguel   lopez perez ")).toBe("ML");
  });

  it("devuelve una sola inicial para un nombre simple", () => {
    expect(getInitials("Carla")).toBe("C");
  });
});
