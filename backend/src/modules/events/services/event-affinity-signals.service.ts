import { Injectable } from '@nestjs/common';
import { ProfileService } from '../../profile/services/profile.service.js';
import { EducationsService } from '../../educations/services/educations.service.js';
import { UserSkillService } from '../../skills/services/user-skill.service.js';
import { RadarEvidenceSourcesService } from '../../radar-integration/services/radar-evidence-sources.service.js';
import type { AffinitySignals } from '../types/affinity-signals.types.js';
import { readRadarScores } from '../utils/read-radar-scores.js';

@Injectable()
export class EventAffinitySignalsService {
  constructor(
    private readonly profiles: ProfileService,
    private readonly educations: EducationsService,
    private readonly skills: UserSkillService,
    private readonly radar: RadarEvidenceSourcesService,
  ) {}

  async findByUserId(userId: string): Promise<AffinitySignals> {
    const [profile, skills, educations, scores] = await Promise.all([
      this.profiles.findPresentation(userId),
      this.skills.getAffinitySkillNames(userId),
      this.educations.findAll(userId),
      this.radar.findLatestScores(userId),
    ]);

    return {
      skills,
      radarScores: readRadarScores(scores),
      careers: educations
        .map(({ degree }) => degree.trim())
        .filter((degree) => degree.length > 0),
      interests: [profile?.headline, profile?.aboutMe]
        .filter((text): text is string => Boolean(text?.trim()))
        .join(' '),
    };
  }
}
