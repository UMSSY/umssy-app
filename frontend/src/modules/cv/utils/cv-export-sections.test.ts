import { describe, expect, it } from "vitest";
import { CV_EXPORT_DEFAULT_SECTIONS } from "../constants/cv-export.constants";
import { countActiveCvSections } from "./count-active-cv-sections";
import { formatRepositoryCount } from "./format-repository-count";

describe("countActiveCvSections", () => {
  it("counts every section when all are included", () => {
    expect(countActiveCvSections(CV_EXPORT_DEFAULT_SECTIONS)).toBe(6);
  });

  it("leaves out the excluded sections", () => {
    expect(
      countActiveCvSections({
        ...CV_EXPORT_DEFAULT_SECTIONS,
        includeProjects: false,
        includeSummary: false,
      }),
    ).toBe(4);
  });
});

describe("formatRepositoryCount", () => {
  it("uses the singular for one repository", () => {
    expect(formatRepositoryCount(1)).toBe("1 repositorio");
  });

  it("uses the plural for several repositories", () => {
    expect(formatRepositoryCount(6)).toBe("6 repositorios");
  });
});
