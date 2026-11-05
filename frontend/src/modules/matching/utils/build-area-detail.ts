import type {
  AreaDetail,
  AreaId,
} from "@/modules/radar-chart/types/area-detail.types";
import { calculateGap } from "@/modules/radar-chart/utils/calculate-gap";
import { getAreaLevel } from "@/modules/radar-chart/utils/get-area-level";
import type { AreaEvidence, RadarAxisId } from "../types/radar-recruiter.types";
import { RADAR_AXES } from "../types/radar-recruiter.types";

/** Convierte la duración textual del backend a años para el timeline de HU3. */
export function parseDurationYears(duration: string): number {
  const match = duration.match(/([\d.,]+)\s*(año|mes)/i);
  if (!match) return 0;

  const amount = Number(match[1].replace(",", "."));
  if (!Number.isFinite(amount)) return 0;

  const years = /año/i.test(match[2]) ? amount : amount / 12;
  return Math.round(years * 10) / 10;
}

interface BuildAreaDetailInput {
  areaId: RadarAxisId;
  score: number;
  average: number;
  evidence: AreaEvidence;
}

/** Mapea evidencias autorizadas a la vista de detalle reutilizada de HU3/HU4. */
export function buildAreaDetail({
  areaId,
  score,
  average,
  evidence,
}: BuildAreaDetailInput): AreaDetail {
  const axis = RADAR_AXES.find((item) => item.id === areaId);

  return {
    id: areaId as AreaId,
    name: axis?.label ?? areaId,
    score,
    level: getAreaLevel(score),
    globalAverage: average,
    gap: calculateGap(score, average),
    courses: evidence.education.map((item) => ({
      id: item.id,
      name: item.degree,
      institution: item.institution,
      year: item.year,
    })),
    certifications: evidence.certifications.map((item) => ({
      id: item.id,
      name: item.name,
      issuer: item.issuer,
      year: item.year,
    })),
    experience: evidence.experiences.map((item) => ({
      id: item.id,
      role: item.position,
      company: item.companyName,
      durationYears: parseDurationYears(item.duration),
      description: item.description ?? undefined,
    })),
    tags: evidence.tags,
  };
}
