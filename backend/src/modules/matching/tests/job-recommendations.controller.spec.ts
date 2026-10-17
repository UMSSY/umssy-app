import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { JobRecommendationsController } from '../controllers/job-recommendations.controller.js';
import type { JobRecommendationsService } from '../services/job-recommendations.service.js';

const USER_ID = '5b1f0c3e-8a4d-4f0b-9a52-1d6c7e2a9b10';

describe('JobRecommendationsController', () => {
  it('protege el controlador con JwtAuthGuard', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, JobRecommendationsController)).toEqual([
      JwtAuthGuard,
    ]);
  });

  it('delega al servicio con el id del usuario autenticado', async () => {
    const response = { isProfileComplete: true, items: [] };
    const service = { getRecommendations: vi.fn().mockResolvedValue(response) };
    const controller = new JobRecommendationsController(
      service as unknown as JobRecommendationsService,
    );

    const result = await controller.getRecommendations(USER_ID);

    expect(service.getRecommendations).toHaveBeenCalledWith(USER_ID);
    expect(result).toEqual(response);
  });

  it('delega el detalle al servicio con el usuario autenticado y el id de la vacante', async () => {
    const response = {
      jobOfferId: 'o1',
      title: 'Vacante',
      companyName: 'Empresa SA',
      modality: 'Remoto',
      description: 'Descripcion',
      score: 50,
      matchedSkills: ['Python'],
      matchedSkillIds: ['s1'],
      missingSkills: ['SQL'],
      missingSkillIds: ['s3'],
      skills: ['Python', 'SQL'],
    };
    const service = { getJobFit: vi.fn().mockResolvedValue(response) };
    const controller = new JobRecommendationsController(
      service as unknown as JobRecommendationsService,
    );

    const result = await controller.getJobFit(USER_ID, { id: 'o1' });

    expect(service.getJobFit).toHaveBeenCalledWith(USER_ID, 'o1');
    expect(result).toEqual(response);
  });
});
