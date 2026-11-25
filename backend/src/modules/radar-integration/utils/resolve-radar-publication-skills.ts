import type { ProfileSkillRowResponse } from '../../skills/responses/profile-skill-row.response.js';
import type { RadarPublicationEvidenceService } from '../services/radar-publication-evidence.service.js';
import type { PublishedSkill } from '../types/radar-publication.types.js';
import { AREA_IDS } from './radar-scoring.js';

type PublicationEvidence = Awaited<
  ReturnType<RadarPublicationEvidenceService['read']>
>;

type EvidenceSkill = Pick<
  ProfileSkillRowResponse,
  'skillId' | 'source' | 'isHighRelevance' | 'evidenceRefs' | 'skill'
>;

export function resolveRadarPublicationSkills(
  userId: string,
  [rows, docs, experiences, educations, certifications]: readonly [
    readonly EvidenceSkill[],
    PublicationEvidence[1],
    PublicationEvidence[2],
    PublicationEvidence[3],
    PublicationEvidence[4],
  ],
): PublishedSkill[] {
  const cvApproved = new Set(
    docs
      .filter(
        (d) =>
          d.review_status === 'approved' &&
          d.extraction_status === 'ready',
      )
      .map((d) => d.cv_id),
  );
  const living: Record<string, Set<string>> = {
    'work-experience': new Set(experiences.map((x) => x.id)),
    presentation: new Set([userId]),
    education: new Set(educations.map((x) => x.id)),
    certification: new Set(certifications.map((x) => x.id)),
    cv: cvApproved,
  };
  return rows.flatMap((r) => {
    const refs = Array.isArray(r.evidenceRefs) ? r.evidenceRefs : [];
    const valid = refs
      .flatMap((entry) => {
        if (
          !entry ||
          typeof entry !== 'object' ||
          !('type' in entry) ||
          !('id' in entry)
        )
          return [];
        const type = entry.type;
        const id = entry.id;
        if (
          typeof type !== 'string' ||
          typeof id !== 'string' ||
          !living[type]?.has(id)
        )
          return [];
        return [{ type, id }];
      })
      .sort((a, b) =>
        `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`),
      );
    if (r.source === 'nlp' && !valid.length) return [];
    if (!AREA_IDS.some((id) => id === r.skill.areaId)) return [];
    return [
      {
        id: r.skillId,
        name: r.skill.name,
        areaId: r.skill.areaId,
        isHighRelevance: r.isHighRelevance && valid.length > 0,
        evidenceRefs: valid,
      },
    ];
  });
}
