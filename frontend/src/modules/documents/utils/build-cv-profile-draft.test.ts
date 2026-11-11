import { describe, expect, it } from "vitest";
import type { CvExtraction } from "../types/cv-extraction.types";
import { buildCvProfileDraft } from "./build-cv-profile-draft";
import { buildDefaultCvSelection } from "./build-default-cv-selection";

const EDUCATION = {
  institution: "Universidad Mayor de San Simón (UMSS)",
  degree: "Licenciatura en Ingeniería de Sistemas",
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

const EXTRACTION: CvExtraction = {
  cvId: "cv-1",
  contact: { firstName: "Juan", lastName: "Pérez", email: "  ", phone: "71234567", location: null },
  educations: [EDUCATION],
  workExperiences: [EXPERIENCE, { ...EXPERIENCE, companyName: "Banco Unión" }],
};

describe("buildDefaultCvSelection", () => {
  it("selects every detected value and entry", () => {
    expect(buildDefaultCvSelection(EXTRACTION)).toEqual({
      contactFields: ["firstName", "lastName", "phone"],
      educations: [0],
      workExperiences: [0, 1],
    });
  });

  it("selects nothing for an empty extraction", () => {
    expect(
      buildDefaultCvSelection({
        ...EXTRACTION,
        contact: { firstName: null, lastName: null, email: null, phone: null, location: null },
        educations: [],
        workExperiences: [],
      }),
    ).toEqual({ contactFields: [], educations: [], workExperiences: [] });
  });
});

describe("buildCvProfileDraft", () => {
  it("keeps only the selected values and entries", () => {
    expect(
      buildCvProfileDraft(EXTRACTION, { contactFields: ["firstName", "email"], educations: [], workExperiences: [1] }),
    ).toEqual({
      cvId: "cv-1",
      contact: { firstName: "Juan" },
      educations: [],
      workExperiences: [{ ...EXPERIENCE, companyName: "Banco Unión" }],
    });
  });

  it("uses the default selection to copy everything that was detected", () => {
    expect(buildCvProfileDraft(EXTRACTION, buildDefaultCvSelection(EXTRACTION))).toEqual({
      cvId: "cv-1",
      contact: { firstName: "Juan", lastName: "Pérez", phone: "71234567" },
      educations: [EDUCATION],
      workExperiences: EXTRACTION.workExperiences,
    });
  });
});
