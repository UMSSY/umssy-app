import { describe, expect, it } from "vitest";
import type { WorkExperienceItem } from "../types/work-experience-item.types";
import { getCompanyGroupPeriod } from "./get-company-group-period";

function createExperience(
  id: string,
  startDate: string,
  endDate: string | null,
  isCurrent: boolean,
): WorkExperienceItem {
  return {
    id,
    companyName: "Banco",
    position: `Cargo ${id}`,
    startDate,
    endDate,
    isCurrent,
    description: null,
  };
}

describe("getCompanyGroupPeriod", () => {
  it("returns an empty string when there are no positions", () => {
    expect(getCompanyGroupPeriod([])).toBe("");
  });

  it("identifies the first recorded position and current status", () => {
    const positions = [
      createExperience("1", "2024-01-01", null, true),
      createExperience("2", "2016-10-01", "2019-05-01", false),
    ];

    expect(getCompanyGroupPeriod(positions)).toBe(
      "Primer cargo: Oct 2016 · Tiene un cargo actual",
    );
  });

  it("identifies the first and last recorded positions without implying continuity", () => {
    const positions = [
      createExperience("1", "2022-02-01", "2023-07-01", false),
      createExperience("2", "2016-10-01", "2019-05-01", false),
    ];

    expect(getCompanyGroupPeriod(positions)).toBe(
      "Primer cargo: Oct 2016 · Último cargo: Jul 2023",
    );
  });

  it("treats a position without an end date as current", () => {
    const positions = [
      createExperience("1", "2024-01-01", null, false),
      createExperience("2", "2020-01-01", "2022-12-31", false),
    ];

    expect(getCompanyGroupPeriod(positions)).toBe(
      "Primer cargo: Ene 2020 · Tiene un cargo actual",
    );
  });
});
