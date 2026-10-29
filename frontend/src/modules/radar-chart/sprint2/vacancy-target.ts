import type { AreaId } from "../types/area-detail.types";
import { RADAR_AXIS_NAMES } from "./types";

/**
 * Epic 4 returns persisted JobOfferResponse.skills as {id,name}, but no areaId.
 * Therefore Epic 3 must obtain the area taxonomy from a verified server-side catalog,
 * rather than guess a vacancy's requirements from arbitrary words in its description.
 */
export interface PublishedJobOffer {
  id: string;
  title: string;
  description: string;
  status: string;
  skills: { id: string; name: string }[];
}

export function buildVacancyTarget(
  offer: PublishedJobOffer,
  catalog: ReadonlyMap<string, AreaId>,
): { target: Record<AreaId, number>; unmappedSkills: string[] } {
  if (offer.status.toLowerCase() !== "publicada" && offer.status.toLowerCase() !== "published") {
    throw new Error("La vacante no está publicada");
  }
  const target = Object.fromEntries(RADAR_AXIS_NAMES.map(({ id }) => [id, 0])) as Record<AreaId, number>;
  const unmappedSkills: string[] = [];
  const seen = new Set<string>();
  for (const skill of offer.skills) {
    if (seen.has(skill.id)) continue;
    seen.add(skill.id);
    const areaId = catalog.get(skill.id);
    if (!areaId) { unmappedSkills.push(skill.name); continue; }
    // Provisional target for UI integration; official rubric must be agreed with PO.
    target[areaId] = Math.min(10, target[areaId] + 2);
  }
  return { target, unmappedSkills };
}
