import { describe, expect, it } from "vitest";
import { WORKSHOP_COVERS } from "../constants/workshop-covers.constants";
import { getWorkshopCover } from "./get-workshop-cover";

describe("Workshop covers", () => {
  it("assigns a stable local cover without depending on random client state", () => {
    for (const id of ["", "taller-1", "taller-2", "área-técnica", "11111111-1111-4111-8111-111111111111"]) {
      expect(WORKSHOP_COVERS).toContain(getWorkshopCover(id));
      expect(getWorkshopCover(id)).toBe(getWorkshopCover(id));
    }
    expect(new Set(Array.from({ length: 12 }, (_, index) => getWorkshopCover(String(index)))).size).toBe(WORKSHOP_COVERS.length);
  });
});
