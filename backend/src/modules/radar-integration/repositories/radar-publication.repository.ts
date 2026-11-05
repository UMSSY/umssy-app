import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { RUBRIC_VERSION, scoreVerifiedSkills, type Scores } from '../radar-scoring.js';

export interface PublishedSkill {
  id: string;
  name: string;
  areaId: string | null;
  isHighRelevance: boolean;
  evidenceRefs: { type: string; id: string }[];
}

export interface SnapshotRow {
  user_id: string;
  version: number;
  rubric_version: string;
  fingerprint: string;
  scores: Scores;
  evidence: Record<string, { id: string; name: string }[]>;
  average_score: string | number;
  created_at: Date;
}

@Injectable()
export class RadarPublicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async sourceSkills(userId: string): Promise<PublishedSkill[]> {
    const [skills, educations, experiences, certifications] = await Promise.all([
      this.prisma.userSkill.findMany({
        where: { userId, verificationStatus: 'approved' },
        select: {
          skillId: true,
          isHighRelevance: true,
          evidenceRefs: true,
          source: true,
          skill: { select: { name: true, areaId: true } },
        },
      }),
      this.prisma.education.findMany({ where: { userId }, select: { id: true } }),
      this.prisma.workExperience.findMany({ where: { userId }, select: { id: true } }),
      this.prisma.certification.findMany({
        where: { userId, documentUrl: { not: null } },
        select: { id: true },
      }),
    ]);

    const living: Record<string, Set<string>> = {
      'work-experience': new Set(experiences.map((item) => item.id)),
      education: new Set(educations.map((item) => item.id)),
      certification: new Set(certifications.map((item) => item.id)),
    };

    return skills.flatMap((row) => {
      const refs = Array.isArray(row.evidenceRefs) ? row.evidenceRefs : [];
      const valid = refs.flatMap((entry) => {
        if (!entry || typeof entry !== 'object' || !('type' in entry) || !('id' in entry)) {
          return [];
        }
        const type = entry.type;
        const id = entry.id;
        if (typeof type !== 'string' || typeof id !== 'string') {
          return [];
        }
        return living[type]?.has(id) ? [{ type, id }] : [];
      });
      if (row.source === 'nlp' && !valid.length) {
        return [];
      }
      return [
        {
          id: row.skillId,
          name: row.skill.name,
          areaId: row.skill.areaId,
          isHighRelevance: row.isHighRelevance && valid.length > 0,
          evidenceRefs: valid,
        },
      ];
    });
  }

  latest(userId: string): Promise<SnapshotRow[]> {
    return this.prisma.$queryRaw<SnapshotRow[]>`
      SELECT * FROM radar_score_snapshots
      WHERE user_id=${userId}::uuid
      ORDER BY version DESC
      LIMIT 1`;
  }

  async publish(userId: string, actorId: string | null) {
    const skills = await this.sourceSkills(userId);
    const calculated = scoreVerifiedSkills(skills);
    const latest = await this.latest(userId);
    if (latest[0]?.fingerprint === calculated.fingerprint) {
      await this.recordAudit(userId, actorId, 'radar.synchronized', latest[0].version, skills);
      return this.toResponse({ ...latest[0], skills });
    }

    const version = (latest[0]?.version ?? 0) + 1;
    const inserted = await this.prisma.$queryRaw<SnapshotRow[]>`
      INSERT INTO radar_score_snapshots (user_id,version,rubric_version,fingerprint,scores,evidence,average_score)
      VALUES (${userId}::uuid,${version},${RUBRIC_VERSION},${calculated.fingerprint},
        ${JSON.stringify(calculated.scores)}::jsonb,${JSON.stringify(calculated.evidence)}::jsonb,${calculated.average})
      RETURNING *`;
    await this.recordAudit(userId, actorId, 'radar.published', version, skills);
    return this.toResponse({ ...inserted[0], skills });
  }

  private recordAudit(
    userId: string,
    actorId: string | null,
    eventType: string,
    version: number,
    skills: PublishedSkill[],
  ) {
    return this.prisma.$executeRaw`
      INSERT INTO radar_audit_events (user_id,actor_id,event_type,details)
      VALUES (${userId}::uuid,${actorId}::uuid,${eventType},
        ${JSON.stringify({ version, rubric: RUBRIC_VERSION, skills })}::jsonb)`;
  }

  private toResponse(row: SnapshotRow & { skills: PublishedSkill[] }) {
    return {
      userId: row.user_id,
      status: 'published' as const,
      version: row.version,
      rubricVersion: row.rubric_version,
      updatedAt: row.created_at,
      scores: row.scores,
      average: Number(row.average_score),
      evidence: row.evidence,
      skills: row.skills,
    };
  }
}
