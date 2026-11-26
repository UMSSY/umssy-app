import { describe, expect, it } from "vitest";
import type { ProfileResponse } from "@/modules/profile";
import { CV_EMPTY_EXTRACTION_SELECTION } from "../constants/cv-extraction.constants";
import type { CvExtraction } from "../types/cv-extraction.types";
import { getCvContactErrors } from "./get-cv-contact-errors";
import { listCvContactReviewFields } from "./list-cv-contact-review-fields";

const PROFILE: ProfileResponse = {
  id: "11111111-1111-4111-8111-111111111111",
  firstName: "Ana",
  lastName: "Rojas",
  institutionalEmail: "ana@umss.edu",
  personalEmail: null,
  phone: null,
  city: null,
  headline: null,
  aboutMe: null,
  updatedAt: "2026-11-01T00:00:00.000Z",
};

const EXTRACTION: CvExtraction = {
  cvId: "cv-1",
  contact: { firstName: "Ana", lastName: "Rojas", email: "ana@mail.com", phone: "77712345", location: null, cityId: null },
  presentation: { headline: null, aboutMe: null },
  educations: [],
  workExperiences: [],
  skills: [],
};

const CONTACT_SELECTION = { ...CV_EMPTY_EXTRACTION_SELECTION, contact: ["firstName", "lastName", "email", "phone"] as const };

describe("getCvContactErrors", () => {
  it("reports the required fields that neither the profile nor the selected cv data fill", () => {
    expect(getCvContactErrors(PROFILE, EXTRACTION, { ...CONTACT_SELECTION, contact: [...CONTACT_SELECTION.contact] })).toEqual({
      cityId: expect.any(String),
    });
  });

  it("reports invalid values coming from the cv", () => {
    const errors = getCvContactErrors(
      { ...PROFILE, city: { id: "city-cbba", title: "Cochabamba" } },
      { ...EXTRACTION, contact: { ...EXTRACTION.contact, phone: "12", email: "correo" } },
      { ...CONTACT_SELECTION, contact: [...CONTACT_SELECTION.contact] },
    );

    expect(Object.keys(errors)).toEqual(["email", "phone"]);
  });

  it("has no errors when the contact is complete or not selected", () => {
    const completeProfile = { ...PROFILE, city: { id: "city-cbba", title: "Cochabamba" } };

    expect(getCvContactErrors(completeProfile, EXTRACTION, { ...CONTACT_SELECTION, contact: [...CONTACT_SELECTION.contact] })).toEqual({});
    expect(getCvContactErrors(PROFILE, EXTRACTION, CV_EMPTY_EXTRACTION_SELECTION)).toEqual({});
    expect(getCvContactErrors(null, EXTRACTION, { ...CONTACT_SELECTION, contact: [...CONTACT_SELECTION.contact] })).toEqual({});
    expect(getCvContactErrors(PROFILE, null, { ...CONTACT_SELECTION, contact: [...CONTACT_SELECTION.contact] })).toEqual({});
  });
});

describe("listCvContactReviewFields", () => {
  it("adds the fields with errors to the detected ones in the usual order", () => {
    expect(listCvContactReviewFields(["email", "firstName"], { cityId: "Selecciona tu ciudad" })).toEqual([
      "firstName",
      "email",
      "cityId",
    ]);
    expect(listCvContactReviewFields(null, undefined)).toEqual([]);
  });
});
