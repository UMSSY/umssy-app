import { describe, expect, it } from "vitest";
import { calculateGap } from "../utils/calculate-gap";
import { getAreaLevel } from "../utils/get-area-level";
import { AREA_DETAILS, AREA_ORDER, GLOBAL_AVERAGE } from "./area-details.data";

describe("AREA_DETAILS", () => {
  it("keeps the preview navigation and detail records in sync", () => {
    expect(Object.keys(AREA_DETAILS)).toEqual(AREA_ORDER);

    for (const id of AREA_ORDER) {
      const detail = AREA_DETAILS[id];
      expect(detail.id).toBe(id);
      expect(detail.globalAverage).toBe(GLOBAL_AVERAGE);
      expect(detail.level).toBe(getAreaLevel(detail.score));
      expect(detail.gap).toBe(calculateGap(detail.score, GLOBAL_AVERAGE));
    }
  });
});
