import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileNotFoundException } from '../../profile/exceptions/profile-not-found.exception.js';
import type { UserSkillService } from '../../skills/services/user-skill.service.js';
import { JobApplicationNotFoundException } from '../exceptions/job-application-not-found.exception.js';
import { JobApplicationNotWithdrawableException } from '../exceptions/job-application-not-withdrawable.exception.js';
import { JobApplicationStatusMissingException } from '../exceptions/job-application-status-missing.exception.js';
import type { JobApplicationsRepository } from '../repositories/job-applications.repository.js';
import type { JobMatchRepository } from '../repositories/job-match.repository.js';
import type { CandidateProfileService } from '../services/candidate-profile.service.js';
import { MyApplicationsService } from '../services/my-applications.service.js';
import type { WeightedScoreService } from '../services/weighted-score.service.js';
import type { MyApplicationRecord } from '../types/my-applications.types.js';

const USER_ID = 'user-1';

const APPLICATION: MyApplicationRecord = {
  id: 'application-1',
  appliedAt: new Date('2026-10-28T14:00:00.000Z'),
  jobOfferId: 'offer-1',
  status: { title: 'En revisión' },
  jobOffer: { title: 'DevOps Senior', company: { title: 'TechBolivia' } },
};

const VACANCY = {
  id: 'offer-1',
  skills: [{ skill: { name: 'Docker' } }],
  requiredCareers: ['Ingeniería de Sistemas'],
  minExperienceYears: 1,
  otherRequirements: [],
};

describe('HU-05 - MyApplicationsService', () => {
  const repository = {
    findAllByUser: vi.fn(),
    findOwned: vi.fn(),
    findStatusId: vi.fn(),
    updateStatus: vi.fn(),
  };
  const jobMatchRepository = { findByIds: vi.fn() };
  const userSkillService = { getUserSkills: vi.fn() };
  const candidateProfileService = { findCandidateProfile: vi.fn() };
  const score = { calculate: vi.fn() };
  let service: MyApplicationsService;

  beforeEach(() => {
    vi.resetAllMocks();
    repository.findAllByUser.mockResolvedValue([APPLICATION]);
    repository.findOwned.mockResolvedValue({ id: 'application-1', status: { title: 'En revisión' } });
    repository.findStatusId.mockResolvedValue({ id: 'status-withdrawn' });
    jobMatchRepository.findByIds.mockResolvedValue([VACANCY]);
    userSkillService.getUserSkills.mockResolvedValue([{ name: 'Docker' }]);
    candidateProfileService.findCandidateProfile.mockResolvedValue({
      career: 'Ingeniería de Sistemas',
      experienceYears: 2,
    });
    score.calculate.mockReturnValue(87);
    service = new MyApplicationsService(
      repository as unknown as JobApplicationsRepository,
      jobMatchRepository as unknown as JobMatchRepository,
      userSkillService as unknown as UserSkillService,
      candidateProfileService as unknown as CandidateProfileService,
      score as unknown as WeightedScoreService,
    );
  });

  it('lista las postulaciones con el formato que espera la pantalla', async () => {
    await expect(service.listMine(USER_ID)).resolves.toEqual([
      {
        id: 'application-1',
        jobOfferId: 'offer-1',
        vacancyTitle: 'DevOps Senior',
        companyName: 'TechBolivia',
        affinityPercentage: 87,
        status: 'En revisión',
        appliedDate: '2026-10-28T14:00:00.000Z',
      },
    ]);
    expect(repository.findAllByUser).toHaveBeenCalledWith(USER_ID);
    expect(jobMatchRepository.findByIds).toHaveBeenCalledWith(['offer-1']);
  });

  it('calcula la afinidad con las habilidades, carrera y experiencia del usuario', async () => {
    await service.listMine(USER_ID);

    const requirements = score.calculate.mock.calls[0][0];
    expect(requirements.skills).toEqual([{ name: 'Docker', status: 'Cumple' }]);
  });

  it('devuelve una lista vacía sin calcular afinidad si no hay postulaciones', async () => {
    repository.findAllByUser.mockResolvedValue([]);

    await expect(service.listMine(USER_ID)).resolves.toEqual([]);
    expect(jobMatchRepository.findByIds).not.toHaveBeenCalled();
  });

  it('usa afinidad 0 si el usuario no tiene perfil o la vacante ya no existe', async () => {
    userSkillService.getUserSkills.mockRejectedValue(new ProfileNotFoundException());
    jobMatchRepository.findByIds.mockResolvedValue([]);

    const [application] = await service.listMine(USER_ID);
    expect(application.affinityPercentage).toBe(0);
  });

  it('retira una postulación propia en revisión', async () => {
    await service.withdraw(USER_ID, 'application-1');

    expect(repository.findOwned).toHaveBeenCalledWith('application-1', USER_ID);
    expect(repository.findStatusId).toHaveBeenCalledWith('Retirada');
    expect(repository.updateStatus).toHaveBeenCalledWith('application-1', 'status-withdrawn');
  });

  it('responde 404 si la postulación no existe o es de otro usuario', async () => {
    repository.findOwned.mockResolvedValue(null);

    await expect(service.withdraw(USER_ID, 'application-1')).rejects.toBeInstanceOf(
      JobApplicationNotFoundException,
    );
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it.each(['Aceptada', 'No seleccionado', 'Retirada'])(
    'no permite retirar una postulación en estado %s',
    async (title) => {
      repository.findOwned.mockResolvedValue({ id: 'application-1', status: { title } });

      await expect(service.withdraw(USER_ID, 'application-1')).rejects.toBeInstanceOf(
        JobApplicationNotWithdrawableException,
      );
      expect(repository.updateStatus).not.toHaveBeenCalled();
    },
  );

  it('falla si el estado Retirada no está en el catálogo', async () => {
    repository.findStatusId.mockResolvedValue(null);

    await expect(service.withdraw(USER_ID, 'application-1')).rejects.toBeInstanceOf(
      JobApplicationStatusMissingException,
    );
  });
});
