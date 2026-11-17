import { describe, expect, it } from "vitest";
import type { SkillOrigin } from "../types/skill-origin.types";
import { isManualSkill } from "./is-manual-skill";

const skill = (origins?: SkillOrigin[]) => ({ id: "skill-1", name: "SQL", origins });

describe("isManualSkill", () => {
  it("keeps the skills added by hand, with or without evidence", () => {
    expect(isManualSkill(skill(["manual"]))).toBe(true);
    expect(isManualSkill(skill(["manual", "experience", "cv"]))).toBe(true);
  });

  it("keeps a skill that has no origin information, like a new one", () => {
    expect(isManualSkill(skill())).toBe(true);
  });

  it("leaves out the skills that only come from an experience or the CV", () => {
    expect(isManualSkill(skill(["experience"]))).toBe(false);
    expect(isManualSkill(skill(["cv"]))).toBe(false);
    expect(isManualSkill(skill([]))).toBe(false);
  });
});
