import { describe, expect, it } from "vitest";
import type { WorkExperienceItem } from "../types/work-experience-item.types";
import { groupWorkExperiences } from "./group-work-experiences";

function createExperience(
  id: string,
  startDate: string,
  endDate: string | null,
  companyName = "UMSS",
): WorkExperienceItem {
  return {
    id,
    startDate,
    endDate,
    companyName,
    position: id,
    isCurrent: endDate === null,
    description: null,
  };
}

describe("groupWorkExperiences", () => {
  it("groups positions at the same company in reverse chronology", () => {
    const earlier = createExperience(
      "junior",
      "2022-01-01",
      "2023-12-31",
      "umss",
    );

    const later = createExperience(
      "senior",
      "2024-01-01",
      null,
    );

    const source = [earlier, later];

    expect(groupWorkExperiences(source)).toEqual([
      {
        id: "company:umss",
        companyName: "UMSS",
        positions: [later, earlier],
      },
    ]);

    expect(source).toEqual([earlier, later]);
  });

  it("groups positions at the same company even after a career break", () => {
    const earlier = createExperience(
      "first",
      "2020-01-01",
      "2021-01-01",
    );

    const later = createExperience(
      "return",
      "2024-01-01",
      null,
    );

    expect(groupWorkExperiences([earlier, later])).toEqual([
      {
        id: "company:umss",
        companyName: "UMSS",
        positions: [later, earlier],
      },
    ]);
  });

  it("groups the same company even when another company appears between positions", () => {
    const first = createExperience(
      "first",
      "2020-01-01",
      "2021-01-01",
      "UMSS",
    );

    const other = createExperience(
      "other",
      "2022-01-01",
      "2023-01-01",
      "Empresa B",
    );

    const returnPosition = createExperience(
      "return",
      "2024-01-01",
      null,
      "UMSS",
    );

    const groups = groupWorkExperiences([
      first,
      other,
      returnPosition,
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].id).toBe("company:umss");
    expect(groups[0].companyName).toBe("UMSS");
    expect(groups[0].positions.map((item) => item.id)).toEqual([
      "return",
      "first",
    ]);
    expect(groups[1].companyName).toBe("Empresa B");
    expect(groups[1].id).toBe("company:empresa b");
  });

  it("keeps different companies independent", () => {
    const first = createExperience(
      "first",
      "2024-01-01",
      null,
      "Empresa A",
    );

    const second = createExperience(
      "second",
      "2023-01-01",
      null,
      "Empresa B",
    );

    expect(groupWorkExperiences([first, second])).toHaveLength(2);
  });

  it("does not group experiences without a company name", () => {
    const first = createExperience(
      "first",
      "2024-01-01",
      null,
      "",
    );

    const second = createExperience(
      "second",
      "2023-01-01",
      null,
      "",
    );

    const groups = groupWorkExperiences([first, second]);

    expect(groups).toHaveLength(2);
    expect(groups[0].id).toBe("experience:first");
    expect(groups[1].id).toBe("experience:second");
  });

  it("uses a stable group id for company names with different casing and spaces", () => {
    const first = createExperience(
      "first",
      "2020-01-01",
      "2021-01-01",
      "UMSS",
    );

    const second = createExperience(
      "second",
      "2022-01-01",
      null,
      " umss ",
    );

    const groups = groupWorkExperiences([first, second]);

    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe("company:umss");
    expect(groups[0].positions.map((item) => item.id)).toEqual([
      "second",
      "first",
    ]);
  });
});
