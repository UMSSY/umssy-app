import { createHash } from 'node:crypto';

export const AREA_IDS = [
  'desarrollo',
  'cloud-devops',
  'data-ai',
  'qa',
  'ciberseguridad',
  'gobernanza-ti',
] as const;

export type RadarAreaId = (typeof AREA_IDS)[number];
export type Scores = Record<RadarAreaId, number>;

export const RUBRIC_VERSION = 'epic3-provisional-1';

export const emptyScores = (): Scores =>
  Object.fromEntries(AREA_IDS.map((id) => [id, 0])) as Scores;

export interface EvidenceSkill {
  id: string;
  name: string;
  areaId: string | null;
  isHighRelevance: boolean;
  evidenceRefs?: readonly { type: string; id: string }[];
}

export interface ScoredRadar {
  scores: Scores;
  evidence: Record<string, { id: string; name: string }[]>;
  average: number;
  fingerprint: string;
}

export function scoreVerifiedSkills(skills: readonly EvidenceSkill[]): ScoredRadar {
  const scores = emptyScores();
  const evidence: Record<string, { id: string; name: string }[]> = Object.fromEntries(
    AREA_IDS.map((areaId) => [areaId, []]),
  );
  const unique = new Map(skills.map((skill) => [skill.id, skill]));

  for (const skill of [...unique.values()].sort((left, right) => left.id.localeCompare(right.id))) {
    if (!AREA_IDS.some((id) => id === skill.areaId)) {
      continue;
    }
    const areaId = skill.areaId as RadarAreaId;
    scores[areaId] = Math.min(10, scores[areaId] + 1 + (skill.isHighRelevance ? 0.5 : 0));
    evidence[areaId].push({ id: skill.id, name: skill.name });
  }

  const average = Number(
    (AREA_IDS.reduce((total, id) => total + scores[id], 0) / AREA_IDS.length).toFixed(2),
  );
  const fingerprint = createHash('sha256')
    .update(
      JSON.stringify({
        rubric: RUBRIC_VERSION,
        skills: [...unique.values()]
          .sort((left, right) => left.id.localeCompare(right.id))
          .map((skill) => ({
            ...skill,
            evidenceRefs: [...(skill.evidenceRefs ?? [])].sort((left, right) =>
              `${left.type}:${left.id}`.localeCompare(`${right.type}:${right.id}`),
            ),
          })),
      }),
    )
    .digest('hex');

  return { scores, evidence, average, fingerprint };
}

export function matchRadar(
  candidate: Scores,
  target: Scores,
): { match: number; gaps: Scores } {
  const gaps = emptyScores();
  for (const id of AREA_IDS) {
    gaps[id] = Math.round((candidate[id] - target[id]) * 10) / 10;
  }
  const match = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        100 - (AREA_IDS.reduce((sum, id) => sum + Math.abs(gaps[id]), 0) / 60) * 100,
      ),
    ),
  );
  return { match, gaps };
}
