import {
  calculateGap,
  getAreaLevel,
  type AreaDetail,
  type AreaId,
} from '@/modules/radar-chart';
import { RADAR_AXES } from '../constants/radar-axes.constants';
import type { BuildAreaDetailInput } from '../types/build-area-detail-input.types';

export function parseDurationYears(duration: string): number {
  const match = duration.match(/([\d.,]+)\s*(año|mes)/i);
  if (!match) return 0;

  const amount = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(amount)) return 0;

  const years = /año/i.test(match[2]) ? amount : amount / 12;
  return Math.round(years * 10) / 10;
}

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
