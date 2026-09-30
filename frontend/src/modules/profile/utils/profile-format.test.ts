import { describe, expect, it } from "vitest";
import { buildEmptyProfile, buildProfile } from "../testing/profile-fixtures";
import {
  getFullName,
  getInitials,
  parseProfileTab,
  toPersonalInfoValues,
  toPresentationValues,
  trimValues,
} from "./profile-format";

describe("parseProfileTab", () => {
  it("returns a known tab", () => {
    expect(parseProfileTab("presentation")).toBe("presentation");
    expect(parseProfileTab(["documents", "personal"])).toBe("documents");
  });

  it("falls back to the personal tab", () => {
    expect(parseProfileTab(undefined)).toBe("personal");
    expect(parseProfileTab("unknown")).toBe("personal");
  });
});

describe("name helpers", () => {
  it("builds the full name and initials", () => {
    expect(getFullName("Valeria", "Quispe")).toBe("Valeria Quispe");
    expect(getInitials("valeria", "quispe")).toBe("VQ");
    expect(getInitials("", "")).toBe("?");
  });
});

describe("form values", () => {
  it("maps a complete profile", () => {
    const profile = buildProfile();

    expect(toPersonalInfoValues(profile)).toEqual({
      firstName: "Valeria",
      lastName: "Quispe",
      cityId: "city-cbba",
      phone: "+591 70000000",
      personalEmail: "valeria@correo.com",
    });
    expect(toPresentationValues(profile).headline).toBe("Desarrolladora web junior");
  });

  it("uses empty strings for missing data", () => {
    const profile = buildEmptyProfile();

    expect(toPersonalInfoValues(profile).cityId).toBe("");
    expect(toPresentationValues(profile)).toEqual({
      headline: "",
      aboutMe: "",
      interestedOpportunities: "",
    });
  });

  it("trims only string values", () => {
    expect(trimValues({ name: "  Valeria ", age: 20 })).toEqual({ name: "Valeria", age: 20 });
  });
});
