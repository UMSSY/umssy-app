import { describe, expect, it } from "vitest";
import { hasCvText } from "./has-cv-text";
import { isCvEducationIncomplete } from "./is-cv-education-incomplete";
import { isCvWorkExperienceIncomplete } from "./is-cv-work-experience-incomplete";
import { toggleListItem } from "./toggle-list-item";

const EDUCATION = {
  institution: "UMSS",
  degree: "Licenciatura",
  startDate: "2014-01-01",
  endDate: "2019-01-01",
  description: null,
};

const EXPERIENCE = {
  companyName: "Empresa SRL",
  position: "Desarrollador",
  startDate: "2021-03-01",
  endDate: null,
  isCurrent: true,
  description: "APIs REST",
};

describe("hasCvText", () => {
  it("accepts only non blank text", () => {
    expect(hasCvText("Juan")).toBe(true);
    expect(hasCvText("   ")).toBe(false);
    expect(hasCvText(null)).toBe(false);
    expect(hasCvText(undefined)).toBe(false);
  });
});

describe("isCvEducationIncomplete", () => {
  it("is complete when every required field is present", () => {
    expect(isCvEducationIncomplete(EDUCATION)).toBe(false);
  });

  it("is incomplete when a required field is missing", () => {
    expect(isCvEducationIncomplete({ ...EDUCATION, endDate: null })).toBe(true);
  });
});

describe("isCvWorkExperienceIncomplete", () => {
  it("accepts a current job without end date", () => {
    expect(isCvWorkExperienceIncomplete(EXPERIENCE)).toBe(false);
  });

  it("requires an end date for past jobs", () => {
    expect(isCvWorkExperienceIncomplete({ ...EXPERIENCE, isCurrent: false })).toBe(true);
  });

  it("requires a description", () => {
    expect(isCvWorkExperienceIncomplete({ ...EXPERIENCE, description: null })).toBe(true);
  });
});

describe("toggleListItem", () => {
  it("adds a missing item and removes an existing one", () => {
    expect(toggleListItem([0, 2], 1)).toEqual([0, 2, 1]);
    expect(toggleListItem([0, 2], 2)).toEqual([0]);
  });
});
