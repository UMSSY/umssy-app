import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { JobMatchController } from '../controllers/job-match.controller.js';
import { jobMatchParamsSchema } from '../requests/job-match.schema.js';
import type { JobMatchService } from '../services/job-match.service.js';
 
const USER_ID = '0b9f8a52-3c1d-4e7a-9d55-6f1c2a8b7e10';
const JOB_OFFER_ID = '5b1f0c3e-8a4d-4f0b-9a52-1d6c7e2a9b10';
 
describe('JobMatchController', () => {
  it('protege el controlador con JwtAuthGuard y RolesGuard', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, JobMatchController)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
  });
 
  it('sólo permite los roles titulado y estudiante', () => {
    expect(Reflect.getMetadata(ROLES_KEY, JobMatchController)).toEqual([
      'titulado',
      'estudiante',
    ]);
  });
 
  it('expone GET job-offers/:id/match', () => {
    expect(Reflect.getMetadata(PATH_METADATA, JobMatchController)).toBe(
      'job-offers',
    );
    expect(
      Reflect.getMetadata(PATH_METADATA, JobMatchController.prototype.getMatch),
    ).toBe(':id/match');
  });
 
  it('delega en el servicio con el usuario autenticado y el id de la ruta', async () => {
    const response = {
      jobOfferId: JOB_OFFER_ID,
      title: 'DevOps Senior',
      companyName: 'TechBolivia',
      modality: 'Remoto',
      description: '',
      score: 100,
      hasPendingRequirements: false,
      requirements: [],
    };
    const jobMatchService = { getMatch: vi.fn().mockResolvedValue(response) };
    const controller = new JobMatchController(
      jobMatchService as unknown as JobMatchService,
    );
 
    await expect(
      controller.getMatch(USER_ID, { id: JOB_OFFER_ID }),
    ).resolves.toEqual(response);
    expect(jobMatchService.getMatch).toHaveBeenCalledWith(
      USER_ID,
      JOB_OFFER_ID,
    );
  });
 
  it('valida que el id sea un UUID', () => {
    expect(jobMatchParamsSchema.safeParse({ id: JOB_OFFER_ID }).success).toBe(
      true,
    );
    expect(jobMatchParamsSchema.safeParse({ id: 'no-es-uuid' }).success).toBe(
      false,
    );
    expect(jobMatchParamsSchema.safeParse({}).success).toBe(false);
  });
});
