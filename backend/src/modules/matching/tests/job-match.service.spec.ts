import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserSkillService } from '../../skills/services/user-skill.service.js';
import { JOB_OFFER_NOT_AVAILABLE_MESSAGE } from '../constants/job-match.constants.js';
import { JobOfferNotAvailableException } from '../exceptions/job-offer-not-available.exception.js';
import type { JobMatchRepository } from '../repositories/job-match.repository.js';
import type { CandidateProfileService } from '../services/candidate-profile.service.js';
import { JobMatchService } from '../services/job-match.service.js';
import { WeightedScoreService } from '../services/weighted-score.service.js';
import type { JobMatchRecord } from '../types/job-match.types.js';

const USER_ID = '0b9f8a52-3c1d-4e7a-9d55-6f1c2a8b7e10';
const JOB_OFFER_ID = '5b1f0c3e-8a4d-4f0b-9a52-1d6c7e2a9b10';
const NO_PROFILE = { career: null, experienceYears: 0 };

interface VacancyOptions {
  careers?: string[];
  minExperienceYears?: number | null;
  others?: string[];
}

function vacancyRecord(
  skillNames: string[],
  options: VacancyOptions = {},
): JobMatchRecord {
  return {
    id: JOB_OFFER_ID,
    title: 'DevOps Senior',
    description: 'Infraestructura en la nube.',
    locationUrl: 'https://maps.google.com/?q=x',
    requiredCareers: options.careers ?? [],
    minExperienceYears: options.minExperienceYears ?? null,
    otherRequirements: options.others ?? [],
    company: { title: 'TechBolivia' },
    modality: { title: 'Remoto' },
    skills: skillNames.map((name) => ({ skill: { name } })),
  } as JobMatchRecord;
}

const skill = (name: string) => ({ id: `id-${name}`, name, isCustom: false });

describe('JobMatchService', () => {
  let repository: { findPublishedById: ReturnType<typeof vi.fn> };
  let candidateProfile: { findCandidateProfile: ReturnType<typeof vi.fn> };
  let userSkillService: { getUserSkills: ReturnType<typeof vi.fn> };
  let service: JobMatchService;

  beforeEach(() => {
    repository = { findPublishedById: vi.fn() };
    candidateProfile = {
      findCandidateProfile: vi.fn().mockResolvedValue(NO_PROFILE),
    };
    userSkillService = { getUserSkills: vi.fn().mockResolvedValue([]) };

    service = new JobMatchService(
      repository as unknown as JobMatchRepository,
      userSkillService as unknown as UserSkillService,
      candidateProfile as unknown as CandidateProfileService,
      new WeightedScoreService(),
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

  it('busca la vacante por id con la hora actual y las habilidades y el perfil de la persona autenticada', async () => {
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
    expect(candidateProfile.findCandidateProfile).toHaveBeenCalledWith(USER_ID);
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
    expect(candidateProfile.findCandidateProfile).not.toHaveBeenCalled();
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

  describe('requisitos académicos, de experiencia y otros', () => {
    const FULL_VACANCY: VacancyOptions = {
      careers: ['Ingeniería de Sistemas'],
      minExperienceYears: 3,
      others: ['Carta de motivación'],
    };

    beforeEach(() => {
      repository.findPublishedById.mockResolvedValue(
        vacancyRecord(['Docker'], FULL_VACANCY),
      );
      userSkillService.getUserSkills.mockResolvedValue([skill('Docker')]);
    });

    it('lista las tres categorías con su estado y pondera con los pesos de cada una (AC-04.5, AC-04.6)', async () => {
      candidateProfile.findCandidateProfile.mockResolvedValue({
        career: 'Ingeniería de Sistemas',
        experienceYears: 1,
      });

      await expect(
        service.getMatch(USER_ID, JOB_OFFER_ID),
      ).resolves.toMatchObject({
        score: 85,
        hasPendingRequirements: true,
        requirements: [
          { name: 'Docker', status: 'Cumple', category: 'skill' },
          { name: 'Ingeniería de Sistemas', status: 'Cumple', category: 'academic' },
          { name: 'Experiencia mínima: 3 años', status: 'Pendiente', category: 'academic' },
          { name: 'Carta de motivación', status: 'Pendiente', category: 'other' },
        ],
      });
    });

    it('marca la carrera como pendiente cuando la formación es otra', async () => {
      candidateProfile.findCandidateProfile.mockResolvedValue({
        career: 'Ingeniería Comercial',
        experienceYears: 5,
      });

      const result = await service.getMatch(USER_ID, JOB_OFFER_ID);

      expect(result.score).toBe(70);
      expect(result.requirements[1]).toEqual({
        name: 'Ingeniería de Sistemas',
        status: 'Pendiente',
        category: 'academic',
      });
      expect(result.requirements[2].status).toBe('Cumple');
    });

    it('acepta la carrera sin tildes ni mayúsculas y los años mínimos exactos', async () => {
      candidateProfile.findCandidateProfile.mockResolvedValue({
        career: 'ingenieria de sistemas',
        experienceYears: 3,
      });

      const result = await service.getMatch(USER_ID, JOB_OFFER_ID);

      expect(result.score).toBe(95);
      expect(result.requirements[1].status).toBe('Cumple');
      expect(result.requirements[2].status).toBe('Cumple');
    });

    it('deja pendiente la carrera cuando la persona no registró formación', async () => {
      candidateProfile.findCandidateProfile.mockResolvedValue(NO_PROFILE);

      const result = await service.getMatch(USER_ID, JOB_OFFER_ID);

      expect(result.requirements[1].status).toBe('Pendiente');
    });
  });
});
