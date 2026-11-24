import { describe, expect, it } from "vitest";
import type { SkillOrigin } from "../types/skill-origin.types";
import { isSkillRemovable } from "./is-skill-removable";

const skill = (origins?: SkillOrigin[]) => ({ id: "skill-1", name: "SQL", origins });

describe("isSkillRemovable", () => {
  it("allows removing a skill that only the user added by hand (AC-10.2)", () => {
    expect(isSkillRemovable(skill(["manual"]))).toBe(true);
  });

  it("allows removing a skill that has no origin information", () => {
    expect(isSkillRemovable(skill())).toBe(true);
  });

  it("blocks removing a skill linked to an experience even when it is also manual (AC-10.1)", () => {
    expect(isSkillRemovable(skill(["manual", "experience"]))).toBe(false);
    expect(isSkillRemovable(skill(["experience"]))).toBe(false);
  });

  it("blocks removing a skill that comes from the CV", () => {
    expect(isSkillRemovable(skill(["cv"]))).toBe(false);
    expect(isSkillRemovable(skill(["manual", "cv"]))).toBe(false);
  });

  it("blocks removing a detected skill without any manual origin", () => {
    expect(isSkillRemovable(skill([]))).toBe(false);
  });
});
