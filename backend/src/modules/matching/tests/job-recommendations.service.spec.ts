import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobOfferResponse } from '../../job-offers/responses/job-offer.response.js';
import type { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import { ProfileNotFoundException } from '../../profile/exceptions/profile-not-found.exception.js';
import type { UserSkillService } from '../../skills/services/user-skill.service.js';
import { JobRecommendationsService } from '../services/job-recommendations.service.js';

const USER_ID = '5b1f0c3e-8a4d-4f0b-9a52-1d6c7e2a9b10';

const PYTHON = { id: 's1', name: 'Python' };
const DOCKER = { id: 's2', name: 'Docker' };
const SQL = { id: 's3', name: 'SQL' };
const REACT = { id: 's4', name: 'React' };

function buildOffer(
  id: string,
  skills: { id: string; name: string }[],
  createdAt = '2026-10-01T00:00:00.000Z',
): JobOfferResponse {
  return {
    id,
    title: `Vacante ${id}`,
    description: 'Descripcion',
    category: 'Tecnologia',
    modality: 'Remoto',
    contractType: 'Tiempo completo',
    status: 'Publicada',
    positionsAvailable: 1,
    salaryRange: '1000',
    languages: 'Espanol',
    locationUrl: 'https://maps.example/x',
    expiresAt: null,
    createdAt,
    company: { id: 'c1', name: 'Empresa SA' },
    skills,
  };
}

describe('JobRecommendationsService', () => {
  let service: JobRecommendationsService;
  let jobOffersService: { listPublished: ReturnType<typeof vi.fn> };
  let userSkillService: { getUserSkills: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    jobOffersService = { listPublished: vi.fn().mockResolvedValue([]) };
    userSkillService = {
      getUserSkills: vi.fn().mockResolvedValue([{ ...PYTHON, isCustom: false }, DOCKER]),
    };
    service = new JobRecommendationsService(
      jobOffersService as unknown as JobOffersService,
      userSkillService as unknown as UserSkillService,
    );
  });

  it('pide las habilidades del usuario autenticado', async () => {
    await service.getRecommendations(USER_ID);

    expect(userSkillService.getUserSkills).toHaveBeenCalledWith(USER_ID);
  });

  it('calcula el porcentaje entero de habilidades requeridas que el usuario tiene', async () => {
    jobOffersService.listPublished.mockResolvedValue([buildOffer('o1', [PYTHON, SQL, REACT])]);

    const result = await service.getRecommendations(USER_ID);

    expect(result).toEqual({
      isProfileComplete: true,
      items: [
        {
          jobOfferId: 'o1',
          title: 'Vacante o1',
          companyName: 'Empresa SA',
          modality: 'Remoto',
          score: 33,
          matchedSkills: ['Python'],
          matchedSkillIds: ['s1'],
          missingSkills: ['SQL', 'React'],
          missingSkillIds: ['s3', 's4'],
          skills: ['Python', 'SQL', 'React'],
        },
      ],
    });
  });

  it('da 100 cuando el usuario tiene todas las habilidades requeridas', async () => {
    jobOffersService.listPublished.mockResolvedValue([buildOffer('o1', [PYTHON, DOCKER])]);

    const result = await service.getRecommendations(USER_ID);

    expect(result.items[0]?.score).toBe(100);
    expect(result.items[0]?.matchedSkills).toEqual(['Python', 'Docker']);
    expect(result.items[0]?.missingSkills).toEqual([]);
    expect(result.items[0]?.missingSkillIds).toEqual([]);
  });

  it('separa las habilidades que coinciden de las que faltan, con nombres e ids', async () => {
    jobOffersService.listPublished.mockResolvedValue([buildOffer('o1', [DOCKER, SQL, REACT])]);

    const result = await service.getRecommendations(USER_ID);
    const item = result.items[0];

    expect(item?.matchedSkills).toEqual(['Docker']);
    expect(item?.matchedSkillIds).toEqual(['s2']);
    expect(item?.missingSkills).toEqual(['SQL', 'React']);
    expect(item?.missingSkillIds).toEqual(['s3', 's4']);
    expect(item?.skills).toEqual(['Docker', 'SQL', 'React']);
  });

  it('mantiene el orden original de las habilidades requeridas en cada grupo', async () => {
    jobOffersService.listPublished.mockResolvedValue([
      buildOffer('o1', [REACT, PYTHON, SQL, DOCKER]),
    ]);

    const result = await service.getRecommendations(USER_ID);

    expect(result.items[0]?.matchedSkills).toEqual(['Python', 'Docker']);
    expect(result.items[0]?.missingSkills).toEqual(['React', 'SQL']);
  });

  it('ordena de mayor a menor porcentaje', async () => {
    jobOffersService.listPublished.mockResolvedValue([
      buildOffer('bajo', [PYTHON, SQL, REACT]),
      buildOffer('alto', [PYTHON, DOCKER]),
      buildOffer('medio', [PYTHON, SQL]),
    ]);

    const result = await service.getRecommendations(USER_ID);

    expect(result.items.map((item) => item.jobOfferId)).toEqual(['alto', 'medio', 'bajo']);
  });

  it('a igualdad de porcentaje pone primero la oferta mas reciente', async () => {
    jobOffersService.listPublished.mockResolvedValue([
      buildOffer('vieja', [PYTHON], '2026-09-01T00:00:00.000Z'),
      buildOffer('nueva', [PYTHON], '2026-10-10T00:00:00.000Z'),
      buildOffer('media', [PYTHON], '2026-09-20T00:00:00.000Z'),
    ]);

    const result = await service.getRecommendations(USER_ID);

    expect(result.items.map((item) => item.jobOfferId)).toEqual(['nueva', 'media', 'vieja']);
  });

  it('omite las ofertas que no coinciden con ninguna habilidad del usuario', async () => {
    jobOffersService.listPublished.mockResolvedValue([
      buildOffer('o1', [SQL, REACT]),
      buildOffer('o2', []),
      buildOffer('o3', [PYTHON]),
    ]);

    const result = await service.getRecommendations(USER_ID);

    expect(result.items.map((item) => item.jobOfferId)).toEqual(['o3']);
  });

  it('marca el perfil como incompleto, sin lista, cuando el usuario no tiene habilidades', async () => {
    userSkillService.getUserSkills.mockResolvedValue([]);
    jobOffersService.listPublished.mockResolvedValue([buildOffer('o1', [PYTHON])]);

    const result = await service.getRecommendations(USER_ID);

    expect(result).toEqual({ isProfileComplete: false, items: [] });
    expect(jobOffersService.listPublished).not.toHaveBeenCalled();
  });

  it('trata la falta de perfil como perfil incompleto', async () => {
    userSkillService.getUserSkills.mockRejectedValue(new ProfileNotFoundException());

    const result = await service.getRecommendations(USER_ID);

    expect(result).toEqual({ isProfileComplete: false, items: [] });
  });

  it('propaga cualquier otro error al leer las habilidades', async () => {
    userSkillService.getUserSkills.mockRejectedValue(new Error('fallo'));

    await expect(service.getRecommendations(USER_ID)).rejects.toThrow('fallo');
  });

  it('responde perfil completo y lista vacia cuando no hay ofertas publicadas', async () => {
    const result = await service.getRecommendations(USER_ID);

    expect(result).toEqual({ isProfileComplete: true, items: [] });
  });
});
