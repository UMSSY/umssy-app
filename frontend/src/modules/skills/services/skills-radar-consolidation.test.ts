import { afterEach, describe, expect, it, vi } from 'vitest';
import { profileSkillsRadarService } from '@/modules/profile/services/profile-skills-radar.service';
import { skillsService } from './skills.service';

vi.mock('@/modules/profile/services/profile-skills-radar.service', () => ({
  profileSkillsRadarService: { getSkills: vi.fn(), analyzeAndGetSkills: vi.fn() },
}));

const radar = {
  userId: 'owner', status: 'ready' as const, version: 2, updatedAt: null, dictionaryVersion: 'v1',
  skills: [
    { id: 'manual', text: 'Manual', name: 'Manual', source: 'manual' as const, areaId: null,
      verificationStatus: 'pending', isHighRelevance: false, evidenceRefs: [] },
    { id: 'python', text: 'Python', name: 'Python', source: 'nlp' as const, areaId: 'data-ai',
      verificationStatus: 'approved', isHighRelevance: true,
      evidenceRefs: [{ type: 'certification' as const, id: 'certificate-1' }] },
  ],
};

afterEach(() => vi.clearAllMocks());

describe('Consulta de habilidades compartida entre perfil y Skills', () => {
  it('consulta el radar a traves del servicio publico de perfil', async () => {
    vi.mocked(profileSkillsRadarService.getSkills).mockResolvedValue(radar);
    await expect(skillsService.getDetectedSkills()).resolves.toEqual({
      status: 'ready',
      skills: [{ id: 'python', name: 'Python', evidenceCount: 1, verificationStatus: 'approved' }],
    });
    expect(profileSkillsRadarService.getSkills).toHaveBeenCalledOnce();
  });

  it('usa la respuesta de la misma peticion POST para actualizar las habilidades', async () => {
    vi.mocked(profileSkillsRadarService.analyzeAndGetSkills).mockResolvedValue(radar);
    const summary = await skillsService.analyzeSkills();
    expect(summary.skills).toHaveLength(1);
    expect(profileSkillsRadarService.analyzeAndGetSkills).toHaveBeenCalledOnce();
    expect(profileSkillsRadarService.getSkills).not.toHaveBeenCalled();
  });
});
