import { describe, expect, it } from "vitest";
import { CV_EMPTY_EXTRACTION_SELECTION } from "../constants/cv-extraction.constants";
import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";
import { buildDefaultCvSelection } from "./build-default-cv-selection";
import { countCvSelection } from "./count-cv-selection";
import { isCvHeadlineMissing } from "./is-cv-headline-missing";
import { isCvSectionFullySelected } from "./is-cv-section-fully-selected";
import { toCvExtraction } from "./to-cv-extraction";
import { toggleCvSection } from "./toggle-cv-section";
import { toggleCvSelectionItem } from "./toggle-cv-selection-item";
import { updateListItem } from "./update-list-item";

const EXTRACTION: CvExtraction = toCvExtraction({
  cvId: "cv-1",
  contact: { firstName: "Ana", email: "  ", cityId: "city-lpz" },
  presentation: "Desarrolladora web",
  educations: null,
  workExperiences: [
    { companyName: "A", position: "B", startDate: null, endDate: null, isCurrent: false, description: null },
  ],
  skills: [{ skillId: "skill-ts", name: "TypeScript" }],
});

const AVAILABLE: CvExtractionSelection = {
  contact: ["firstName", "cityId"],
  presentation: [0],
  education: [],
  experience: [0],
  skills: [0],
};

describe("toCvExtraction", () => {
  it("fills the missing data with empty values", () => {
    expect(toCvExtraction({ cvId: "cv-2" })).toEqual({
      cvId: "cv-2",
      contact: { firstName: null, lastName: null, email: null, phone: null, location: null, cityId: null },
      presentation: { headline: null, aboutMe: null },
      educations: [],
      workExperiences: [],
      skills: [],
    });
  });
});

describe("buildDefaultCvSelection", () => {
  it("selects only the detected data of every section", () => {
    expect(buildDefaultCvSelection(EXTRACTION)).toEqual(AVAILABLE);
  });
});

describe("toggleCvSection", () => {
  it("selects the whole section when it is partially selected", () => {
    const selection = { ...AVAILABLE, contact: ["cityId" as const] };

    expect(toggleCvSection(selection, AVAILABLE, "contact").contact).toEqual(["firstName", "cityId"]);
  });

  it("clears the section when it is fully selected", () => {
    expect(toggleCvSection(AVAILABLE, AVAILABLE, "experience")).toEqual({ ...AVAILABLE, experience: [] });
  });
});

describe("toggleCvSelectionItem", () => {
  it("adds or removes one item of a section", () => {
    const withoutSkill = toggleCvSelectionItem(AVAILABLE, "skills", 0);

    expect(withoutSkill.skills).toEqual([]);
    expect(toggleCvSelectionItem(withoutSkill, "skills", 0).skills).toEqual([0]);
    expect(toggleCvSelectionItem(AVAILABLE, "contact", "firstName").contact).toEqual(["cityId"]);
  });
});

describe("isCvSectionFullySelected", () => {
  it.each([
    [[0, 1], [0, 1], true],
    [[0], [0, 1], false],
    [[], [], false],
  ])("checks %j against %j", (selected, available, expected) => {
    expect(isCvSectionFullySelected(selected, available)).toBe(expected);
  });
});

describe("countCvSelection", () => {
  it("counts the selected items of every section", () => {
    expect(countCvSelection(AVAILABLE)).toBe(5);
    expect(countCvSelection(CV_EMPTY_EXTRACTION_SELECTION)).toBe(0);
  });
});

describe("isCvHeadlineMissing", () => {
  it("requires a headline only when the presentation is selected", () => {
    expect(isCvHeadlineMissing(EXTRACTION, AVAILABLE)).toBe(true);
    expect(isCvHeadlineMissing(EXTRACTION, { ...AVAILABLE, presentation: [] })).toBe(false);
    expect(
      isCvHeadlineMissing({ ...EXTRACTION, presentation: { headline: "Dev", aboutMe: "x" } }, AVAILABLE),
    ).toBe(false);
    expect(isCvHeadlineMissing(null, AVAILABLE)).toBe(false);
  });
});

describe("updateListItem", () => {
  it("changes only the item at the given index", () => {
    expect(updateListItem([{ name: "a" }, { name: "b" }], 1, { name: "c" })).toEqual([{ name: "a" }, { name: "c" }]);
    expect(updateListItem<{ name: string }>(null, 0, { name: "c" })).toEqual([]);
  });
});
