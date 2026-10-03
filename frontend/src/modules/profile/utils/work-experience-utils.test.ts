import { describe, expect, it } from "vitest";
import { SAMPLE_WORK_EXPERIENCES } from "../config/work-experience-samples.config";
import { formatWorkPeriod } from "./format-work-period";
import { sortWorkExperiences } from "./sort-work-experiences";

describe("formatWorkPeriod", () => {
  it("shows Actualidad for a current job", () => {
    expect(formatWorkPeriod("2024-07", null, true)).toBe("Jul 2024 – Actualidad");
  });

  it("shows the year once when both dates are in the same year", () => {
    expect(formatWorkPeriod("2024-07", "2024-12", false)).toBe("Jul – Dic 2024");
  });

  it("shows both years when the dates are in different years", () => {
    expect(formatWorkPeriod("2023-03", "2024-12", false)).toBe("Mar 2023 – Dic 2024");
  });
});

describe("sortWorkExperiences", () => {
  it("orders current jobs first and then from the most recent", () => {
    const sorted = sortWorkExperiences([...SAMPLE_WORK_EXPERIENCES].reverse());
    expect(sorted.map((experience) => experience.id)).toEqual(["sample-1", "sample-2", "sample-3"]);
  });
});

