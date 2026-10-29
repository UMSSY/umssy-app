import type { AreaId } from "../types/area-detail.types";
import { RADAR_AXIS_NAMES, type Epic2RadarSource, type Epic2Skill, type RadarBridgeView } from "./types";

const ALLOWED = new Set<string>(RADAR_AXIS_NAMES.map((axis) => axis.id));
const SCALE_MAX = 10;

/**
 * RÚBRICA PROVISIONAL para integrar e ilustrar el flujo técnico.
 * No es la ponderación oficial del Product Owner ni una validación de autenticidad.
 * 1 punto por habilidad aprobada + 0.5 por alta relevancia, máximo 10 por eje.
 * Una habilidad duplicada (mismo id) cuenta una sola vez.
 */
export function mapEpic2Radar(source: Epic2RadarSource): RadarBridgeView {
  if (!source.userId || !Array.isArray(source.skills)) throw new Error("Respuesta NLP incompleta");
  const seen = new Set<string>();
  const approved: Epic2Skill[] = [];
  let pendingCount = 0;
  for (const skill of source.skills) {
    if (!skill?.id || seen.has(skill.id)) continue;
    seen.add(skill.id);
    if (skill.verificationStatus !== "approved") {
      pendingCount++;
      continue;
    }
    if (!skill.areaId || !ALLOWED.has(skill.areaId)) continue;
    approved.push(skill);
  }
  const areas = RADAR_AXIS_NAMES.map((axis) => {
    const score = approved
      .filter((skill) => skill.areaId === axis.id)
      .reduce((total, skill) => total + (skill.isHighRelevance ? 1.5 : 1), 0);
    return { id: axis.id, name: axis.name, score: Math.min(SCALE_MAX, score) };
  });
  const average = areas.reduce((sum, area) => sum + area.score, 0) / areas.length;
  return {
    userId: source.userId,
    status: source.status,
    version: source.version,
    updatedAt: source.updatedAt,
    dictionaryVersion: source.dictionaryVersion,
    areas,
    average,
    approved,
    pendingCount,
    keywordCount: approved.length,
    highRelevanceCount: approved.filter((skill) => skill.isHighRelevance).length,
    rubric: "epic3-provisional-1",
  };
}

export function scoreForArea(source: RadarBridgeView, areaId: AreaId): number {
  return source.areas.find((area) => area.id === areaId)?.score ?? 0;
}

/** Difference candidate - vacancy; sign used consistently in the existing Matching UI. */
export function compareWithTarget(
  candidate: RadarBridgeView,
  target: Partial<Record<AreaId, number>>,
): { gaps: Record<AreaId, number>; percentage: number } {
  const gaps = {} as Record<AreaId, number>;
  let distance = 0;
  for (const area of RADAR_AXIS_NAMES) {
    const t = Math.min(SCALE_MAX, Math.max(0, target[area.id] ?? 0));
    const delta = Math.round((scoreForArea(candidate, area.id) - t) * 10) / 10;
    gaps[area.id] = delta;
    distance += Math.abs(delta);
  }
  const percentage = Math.max(0, Math.min(100, Math.round(100 - distance / (RADAR_AXIS_NAMES.length * SCALE_MAX) * 100)));
  return { gaps, percentage };
}
