import { describe, expect, it, vi } from 'vitest';
import type { ProfileService } from '../../profile/services/profile.service.js';
import type { EducationsService } from '../../educations/services/educations.service.js';
import type { UserSkillService } from '../../skills/services/user-skill.service.js';
import type { RadarEvidenceSourcesService } from '../../radar-integration/services/radar-evidence-sources.service.js';
import { EventAffinitySignalsService } from '../services/event-affinity-signals.service.js';

describe('EventAffinitySignalsService', () => {
  it('combines projections supplied by their owning domains', async () => {
    const profiles = {
      findPresentation: vi
        .fn()
        .mockResolvedValue({ headline: 'Frontend dev', aboutMe: '  ' }),
    };
    const educations = {
      findAll: vi
        .fn()
        .mockResolvedValue([
          { degree: ' Ingeniería de Sistemas ' },
          { degree: ' ' },
        ]),
    };
    const skills = {
      getAffinitySkillNames: vi.fn().mockResolvedValue(['React']),
    };
    const radar = {
      findLatestScores: vi.fn().mockResolvedValue({ desarrollo: 6 }),
    };
    const service = new EventAffinitySignalsService(
      profiles as unknown as ProfileService,
      educations as unknown as EducationsService,
      skills as unknown as UserSkillService,
      radar as unknown as RadarEvidenceSourcesService,
    );

    await expect(service.findByUserId('user-1')).resolves.toEqual({
      skills: ['React'],
      radarScores: { desarrollo: 6 },
      careers: ['Ingeniería de Sistemas'],
      interests: 'Frontend dev',
    });
    expect(profiles.findPresentation).toHaveBeenCalledWith('user-1');
    expect(educations.findAll).toHaveBeenCalledWith('user-1');
    expect(skills.getAffinitySkillNames).toHaveBeenCalledWith('user-1');
    expect(radar.findLatestScores).toHaveBeenCalledWith('user-1');
  });

  it('returns empty signals for a profile without data', async () => {
    const service = new EventAffinitySignalsService(
      {
        findPresentation: vi.fn().mockResolvedValue(null),
      } as unknown as ProfileService,
      {
        findAll: vi.fn().mockResolvedValue([]),
      } as unknown as EducationsService,
      {
        getAffinitySkillNames: vi.fn().mockResolvedValue([]),
      } as unknown as UserSkillService,
      {
        findLatestScores: vi.fn().mockResolvedValue(null),
      } as unknown as RadarEvidenceSourcesService,
    );
    await expect(service.findByUserId('user-1')).resolves.toEqual({
      skills: [],
      radarScores: {},
      careers: [],
      interests: '',
    });
  });
});
