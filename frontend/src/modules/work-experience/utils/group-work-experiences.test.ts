import { describe, expect, it } from "vitest";
import type { WorkExperienceItem } from "../types/work-experience-item.types";
import { groupWorkExperiences } from "./group-work-experiences";

function createExperience(id: string, startDate: string, endDate: string | null, companyName = "UMSS"): WorkExperienceItem {
  return { id, startDate, endDate, companyName, position: id, isCurrent: endDate === null, description: null };
}

describe("groupWorkExperiences", () => {
  it("groups consecutive positions at the same company in reverse chronology without changing the source", () => {
    const earlier = createExperience("junior", "2022-01-01", "2023-12-31", "umss");
    const later = createExperience("senior", "2024-01-01", null);
    const source = [earlier, later];
    expect(groupWorkExperiences(source)).toEqual([{ companyName: "UMSS", positions: [later, earlier] }]);
    expect(source).toEqual([earlier, later]);
  });

  it("keeps separate periods at a company apart after a career break", () => {
    const earlier = createExperience("first", "2020-01-01", "2021-01-01");
    const later = createExperience("return", "2024-01-01", null);
    expect(groupWorkExperiences([earlier, later])).toHaveLength(2);
  });

  it("keeps different companies apart and leaves overlapping current jobs independent", () => {
    const first = createExperience("first", "2024-01-01", null);
    const second = createExperience("second", "2023-01-01", null);
    const third = createExperience("third", "2022-01-01", "2023-01-01", "Empresa");
    expect(groupWorkExperiences([first, second, third])).toHaveLength(3);
  });
});
