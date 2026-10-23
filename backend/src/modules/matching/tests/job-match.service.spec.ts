import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserSkillService } from '../../skills/services/user-skill.service.js';
import { JOB_OFFER_NOT_AVAILABLE_MESSAGE } from '../constants/job-match.constants.js';
import { JobOfferNotAvailableException } from '../exceptions/job-offer-not-available.exception.js';
import type { JobMatchRepository } from '../repositories/job-match.repository.js';
import { JobMatchService } from '../services/job-match.service.js';
import { WeightedScoreService } from '../services/weighted-score.service.js';
import type { JobMatchRecord } from '../types/job-match.types.js';
 
const USER_ID = '0b9f8a52-3c1d-4e7a-9d55-6f1c2a8b7e10';
const JOB_OFFER_ID = '5b1f0c3e-8a4d-4f0b-9a52-1d6c7e2a9b10';
 
function vacancyRecord(skillNames: string[]): JobMatchRecord {
  return {
    id: JOB_OFFER_ID,
    title: 'DevOps Senior',
    description: 'Infraestructura en la nube.',
    company: { title: 'TechBolivia' },
    modality: { title: 'Remoto' },
    skills: skillNames.map((name) => ({ skill: { name } })),
  } as JobMatchRecord;
}
 
const skill = (name: string) => ({ id: `id-${name}`, name, isCustom: false });
 
describe('JobMatchService', () => {
  let repository: { findPublishedById: ReturnType<typeof vi.fn> };
  let userSkillService: { getUserSkills: ReturnType<typeof vi.fn> };
  let prismaMock: { education: { findFirst: ReturnType<typeof vi.fn> }; workExperience: { findMany: ReturnType<typeof vi.fn> } };
  let service: JobMatchService;
 
  beforeEach(() => {
    repository = { findPublishedById: vi.fn() };
    userSkillService = { getUserSkills: vi.fn().mockResolvedValue([]) };
    prismaMock = {
      education: { findFirst: vi.fn().mockResolvedValue({ degree: 'Ingeniería de Sistemas' }) },
      workExperience: { findMany: vi.fn().mockResolvedValue([]) },
    };

    service = new JobMatchService(
      repository as unknown as JobMatchRepository,
      userSkillService as unknown as UserSkillService,
      new WeightedScoreService(),
      prismaMock as any,
    );
  });
 
  it('devuelve los datos de la vacante, el puntaje y los requisitos con su estado', async () => {
    repository.findPublishedById.mockResolvedValue(
      vacancyRecord(['AWS', 'Docker', 'Terraform']),
    );
    userSkillService.getUserSkills.mockResolvedValue([
      skill('Docker'),
      skill('AWS'),
    ]);
 
    await expect(service.getMatch(USER_ID, JOB_OFFER_ID)).resolves.toEqual({
      jobOfferId: JOB_OFFER_ID,
      title: 'DevOps Senior',
      companyName: 'TechBolivia',
      modality: 'Remoto',
      description: 'Infraestructura en la nube.',
      score: 67,
      hasPendingRequirements: true,
      requirements: [
        { name: 'AWS', status: 'Cumple', category: 'skill' },
        { name: 'Docker', status: 'Cumple', category: 'skill' },
        { name: 'Terraform', status: 'Pendiente', category: 'skill' },
      ],
    });
  });
 
  it('busca la vacante por id con la hora actual y las habilidades de la persona autenticada', async () => {
    repository.findPublishedById.mockResolvedValue(vacancyRecord(['Docker']));
    const before = Date.now();
 
    await service.getMatch(USER_ID, JOB_OFFER_ID);
 
    const [id, now] = repository.findPublishedById.mock.calls[0] as [
      string,
      Date,
    ];
    expect(id).toBe(JOB_OFFER_ID);
    expect(now.getTime()).toBeGreaterThanOrEqual(before);
    expect(userSkillService.getUserSkills).toHaveBeenCalledWith(USER_ID);
  });
 
  it('lanza 404 con el aviso aprobado cuando la vacante no existe, no está publicada o venció', async () => {
    repository.findPublishedById.mockResolvedValue(null);
 
    const error = await service
      .getMatch(USER_ID, JOB_OFFER_ID)
      .catch((reason: unknown) => reason);
 
    expect(error).toBeInstanceOf(JobOfferNotAvailableException);
    expect(error).toMatchObject({
      statusCode: 404,
      message: JOB_OFFER_NOT_AVAILABLE_MESSAGE,
    });
    expect(JOB_OFFER_NOT_AVAILABLE_MESSAGE).toBe(
      'La vacante no existe o no está disponible',
    );
    expect(userSkillService.getUserSkills).not.toHaveBeenCalled();
  });
 
  it('una vacante sin requisitos da 100 % y no tiene pendientes (AC-03.5, AC-04.4)', async () => {
    repository.findPublishedById.mockResolvedValue(vacancyRecord([]));
 
    await expect(
      service.getMatch(USER_ID, JOB_OFFER_ID),
    ).resolves.toMatchObject({
      score: 100,
      hasPendingRequirements: false,
      requirements: [],
    });
  });
 
  it('cumplir todo da 100 % sin pendientes y no cumplir nada da 0 % (AC-03.5)', async () => {
    repository.findPublishedById.mockResolvedValue(
      vacancyRecord(['Docker', 'AWS']),
    );
 
    userSkillService.getUserSkills.mockResolvedValue([
      skill('Docker'),
      skill('AWS'),
      skill('Git'),
    ]);
    await expect(
      service.getMatch(USER_ID, JOB_OFFER_ID),
    ).resolves.toMatchObject({
      score: 100,
      hasPendingRequirements: false,
    });
 
    userSkillService.getUserSkills.mockResolvedValue([]);
    await expect(
      service.getMatch(USER_ID, JOB_OFFER_ID),
    ).resolves.toMatchObject({
      score: 0,
      hasPendingRequirements: true,
    });
  });
 
  it('compara las habilidades sin distinguir mayúsculas ni tildes (AC-04.8)', async () => {
    repository.findPublishedById.mockResolvedValue(
      vacancyRecord(['Python', 'Análisis de datos']),
    );
    userSkillService.getUserSkills.mockResolvedValue([
      skill('python'),
      skill('analisis de datos'),
    ]);
 
    await expect(
      service.getMatch(USER_ID, JOB_OFFER_ID),
    ).resolves.toMatchObject({ score: 100 });
  });
 
  it('recalcula al agregar o quitar una habilidad del perfil, sin guardar nada (AC-03.7, AC-04.7)', async () => {
    repository.findPublishedById.mockResolvedValue(
      vacancyRecord(['Docker', 'Kubernetes']),
    );
    const scoreWith = async (...names: string[]) => {
      userSkillService.getUserSkills.mockResolvedValue(names.map(skill));
      return (await service.getMatch(USER_ID, JOB_OFFER_ID)).score;
    };
 
    expect(await scoreWith('Docker')).toBe(50);
    expect(await scoreWith('Docker', 'Kubernetes')).toBe(100);
    expect(await scoreWith('Docker')).toBe(50);
  });
});
