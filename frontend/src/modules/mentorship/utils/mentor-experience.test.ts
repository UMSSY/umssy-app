import { describe, expect, it } from "vitest";
import type { MentorProfile } from "../types/mentor-profile.types";
import { calculateExperienceYears } from "./mentor-experience";

const experience = (startDate: string, endDate: string | null): MentorProfile["workExperiences"][number] => ({
  id: startDate,
  position: "Ingeniera",
  startDate,
  endDate,
  isCurrent: endDate === null,
  description: null,
  company: { id: "company", title: "Empresa" },
});

describe("calculateExperienceYears", () => {
  it("counts overlapping employment months once", () => {
    expect(calculateExperienceYears([
      experience("2020-01-01", "2022-12-31"),
      experience("2021-01-01", "2023-12-31"),
    ])).toBe(4);
  });

  it("returns no invented years without valid periods", () => {
    expect(calculateExperienceYears([])).toBeNull();
    expect(calculateExperienceYears([experience("invalid", null)])).toBeNull();
  });
});
