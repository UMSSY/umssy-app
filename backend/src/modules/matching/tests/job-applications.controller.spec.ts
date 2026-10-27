import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { JobApplicationsController } from '../controllers/job-applications.controller.js';
import type { JobApplicationsService } from '../services/job-applications.service.js';

const OFFER_ID = '7c3e9a10-1d2b-4f5a-9c8e-2b4d6f8a0c11';
const USER_ID = 'b2a1c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d';

describe('HU-02B T2.8 - JobApplicationsController', () => {
  it('protege el controlador con JwtAuthGuard y RolesGuard', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, JobApplicationsController),
    ).toEqual([JwtAuthGuard, RolesGuard]);
  });

  it('sólo permite postular a los roles titulado y estudiante', () => {
    expect(Reflect.getMetadata(ROLES_KEY, JobApplicationsController)).toEqual([
      'titulado',
      'estudiante',
    ]);
  });

  it('postula con el id de la vacante y el usuario autenticado', async () => {
    const response = { id: 'application-1', status: 'En revisión' };
    const service = {
      apply: vi.fn().mockResolvedValue(response),
      findMine: vi.fn(),
    };
    const controller = new JobApplicationsController(
      service as unknown as JobApplicationsService,
    );

    await expect(controller.apply(OFFER_ID, USER_ID)).resolves.toEqual(
      response,
    );
    expect(service.apply).toHaveBeenCalledWith(USER_ID, OFFER_ID);
  });

  it('consulta la postulación propia de la vacante', async () => {
    const response = { hasApplied: false, application: null };
    const service = {
      apply: vi.fn(),
      findMine: vi.fn().mockResolvedValue(response),
    };
    const controller = new JobApplicationsController(
      service as unknown as JobApplicationsService,
    );

    await expect(controller.findMine(OFFER_ID, USER_ID)).resolves.toEqual(
      response,
    );
    expect(service.findMine).toHaveBeenCalledWith(USER_ID, OFFER_ID);
  });
});
