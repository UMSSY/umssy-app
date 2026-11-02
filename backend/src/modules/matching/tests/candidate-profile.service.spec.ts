import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EducationsService } from '../../educations/services/educations.service.js';
import type { WorkExperienceService } from '../../work-experience/services/work-experience.service.js';
import { CandidateProfileService } from '../services/candidate-profile.service.js';

const USER_ID = 'user-1';

function education(degree: string) {
  return { id: degree, degree };
}

function experience(
  startDate: string,
  endDate: string | null,
  isCurrent = false,
) {
  return { id: startDate, startDate, endDate, isCurrent };
}

describe('CandidateProfileService', () => {
  let educationsService: { findAll: ReturnType<typeof vi.fn> };
  let workExperienceService: { findAll: ReturnType<typeof vi.fn> };
  let service: CandidateProfileService;

  beforeEach(() => {
    educationsService = { findAll: vi.fn().mockResolvedValue([]) };
    workExperienceService = { findAll: vi.fn().mockResolvedValue([]) };
    service = new CandidateProfileService(
      educationsService as unknown as EducationsService,
      workExperienceService as unknown as WorkExperienceService,
    );
  });

  it('arma el perfil con la formación más reciente y los años de experiencia', async () => {
    educationsService.findAll.mockResolvedValue([
      education('Ingeniería de Sistemas'),
      education('Técnico Superior'),
    ]);
    workExperienceService.findAll.mockResolvedValue([
      experience('2020-01-01', '2022-01-01'),
    ]);

    await expect(service.findCandidateProfile(USER_ID)).resolves.toEqual({
      career: 'Ingeniería de Sistemas',
      experienceYears: 2,
    });
    expect(educationsService.findAll).toHaveBeenCalledWith(USER_ID);
    expect(workExperienceService.findAll).toHaveBeenCalledWith(USER_ID);
  });

  it('no cuenta dos veces los periodos de experiencia que se solapan', async () => {
    workExperienceService.findAll.mockResolvedValue([
      experience('2020-01-01', '2022-01-01'),
      experience('2021-01-01', '2023-01-01'),
    ]);

    const profile = await service.findCandidateProfile(USER_ID);

    expect(profile.experienceYears).toBe(3);
  });

  it('devuelve carrera nula y 0 años cuando el perfil no tiene formación ni experiencia', async () => {
    await expect(service.findCandidateProfile(USER_ID)).resolves.toEqual({
      career: null,
      experienceYears: 0,
    });
  });

  it('propaga el error de los servicios de formación y experiencia', async () => {
    educationsService.findAll.mockRejectedValue(new Error('Database unavailable'));

    await expect(service.findCandidateProfile(USER_ID)).rejects.toThrow(
      'Database unavailable',
    );
  });
});
