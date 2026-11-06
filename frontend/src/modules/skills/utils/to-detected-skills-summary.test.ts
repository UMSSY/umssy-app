import { describe, expect, it } from "vitest";
import { toDetectedSkillsSummary } from "./to-detected-skills-summary";

describe("toDetectedSkillsSummary", () => {
  it("keeps only the skills found by the analysis", () => {
    expect(
      toDetectedSkillsSummary({
        userId: "user-1",
        status: "ready",
        version: 2,
        updatedAt: "2026-10-23T12:00:00.000Z",
        dictionaryVersion: "1.0.0",
        skills: [
          { id: "python", name: "Python", source: "manual", areaId: null, verificationStatus: "pending", isHighRelevance: true, evidenceRefs: [{ type: "education", id: "e1" }] },
          { id: "docker", name: "Docker", source: "nlp", areaId: null, verificationStatus: "pending", isHighRelevance: true, evidenceRefs: [{ type: "work-experience", id: "w1" }, { type: "education", id: "e1" }] },
        ],
      }),
    ).toEqual({ status: "ready", skills: [{ id: "docker", name: "Docker", evidenceCount: 2, verificationStatus: "pending" }] });
  });

  it("treats a missing response as a pending empty result", () => {
    expect(toDetectedSkillsSummary(null)).toEqual({ status: "pending", skills: [] });
  });

  it("accepts skills without evidence references", () => {
    const response = {
      userId: "user-1", status: "ready" as const, version: 1, updatedAt: null, dictionaryVersion: null,
      skills: [{ id: "go", name: "Go", source: "nlp" as const, areaId: null, verificationStatus: "pending", isHighRelevance: false, evidenceRefs: null as unknown as [] }],
    };
    expect(toDetectedSkillsSummary(response).skills).toEqual([{ id: "go", name: "Go", evidenceCount: 0, verificationStatus: "pending" }]);
  });
});
