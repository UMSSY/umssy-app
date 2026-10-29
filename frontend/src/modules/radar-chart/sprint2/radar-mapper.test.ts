import { describe, expect, it } from "vitest";
import { compareWithTarget, mapEpic2Radar } from "./radar-mapper";
import type { Epic2RadarSource } from "./types";

const mock: Epic2RadarSource = {
  userId: "profile-1", status: "ready", version: 4, updatedAt: "2026-10-25T10:00:00Z",
  dictionaryVersion: "v1", skills: [
    { id: "1", text: "Python", name: "Python", source: "nlp", areaId: "data-ai", verificationStatus: "approved", isHighRelevance: true, evidenceRefs: [{ type: "work-experience", id: "exp1" }] },
    { id: "2", text: "Docker", name: "Docker", source: "manual", areaId: "cloud-devops", verificationStatus: "pending", isHighRelevance: false, evidenceRefs: [] },
    { id: "3", text: "CSS", name: "CSS", source: "nlp", areaId: "desarrollo", verificationStatus: "approved", isHighRelevance: false, evidenceRefs: [] },
  ],
};

describe("Integración Épica 2 → Radar Épica 3", () => {
  it("devuelve los seis ejes vacíos y promedio cero con lista de habilidades vacía", () => {
    const view = mapEpic2Radar({ ...mock, skills: [] });
    expect(view.areas).toHaveLength(6);
    expect(view.areas.every((area) => area.score === 0)).toBe(true);
    expect(view.average).toBe(0);
  });
  it("solo pondera habilidades aprobadas y conserva referencias", () => {
    const view = mapEpic2Radar(mock);
    expect(view.areas.find((area) => area.id === "data-ai")?.score).toBe(1.5);
    expect(view.areas.find((area) => area.id === "cloud-devops")?.score).toBe(0);
    expect(view.approved[0].evidenceRefs).toEqual([{ type: "work-experience", id: "exp1" }]);
    expect(view.pendingCount).toBe(1);
  });
  it("ignora habilidades repetidas o sin área válida", () => {
    const view = mapEpic2Radar({ ...mock, skills: [mock.skills[0], mock.skills[0], { ...mock.skills[0], id: "new", areaId: "other" }] });
    expect(view.keywordCount).toBe(1);
    expect(view.average).toBeCloseTo(0.25);
  });
  it("acota todas las puntuaciones a diez", () => {
    const skills = Array.from({ length: 40 }, (_, index) => ({ ...mock.skills[0], id: `skill-${index}` }));
    expect(mapEpic2Radar({ ...mock, skills }).areas.find((area) => area.id === "data-ai")?.score).toBe(10);
  });
  it("calcula brechas y compatibilidad entre 0 y 100 sin inventar perfiles", () => {
    const view = mapEpic2Radar(mock);
    const comparison = compareWithTarget(view, { "data-ai": 3, desarrollo: 2 });
    expect(comparison.gaps["data-ai"]).toBe(-1.5);
    expect(comparison.percentage).toBeGreaterThanOrEqual(0);
    expect(comparison.percentage).toBeLessThanOrEqual(100);
  });
});
