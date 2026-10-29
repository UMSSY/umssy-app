import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { CompanyJobApplicantsController } from '../controllers/company-job-applicants.controller.js';
import type { CompanyJobApplicantsService } from '../services/company-job-applicants.service.js';

const COMPANY_ID = 'a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
const OFFER_ID = '7c3e9a10-1d2b-4f5a-9c8e-2b4d6f8a0c11';

describe('HU-02B - CompanyJobApplicantsController', () => {
  it('protege el controlador con JwtAuthGuard y RolesGuard', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, CompanyJobApplicantsController),
    ).toEqual([JwtAuthGuard, RolesGuard]);
  });

  it('sólo permite ver los postulantes al rol empresa', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, CompanyJobApplicantsController),
    ).toEqual(['empresa']);
  });

  it('lista los postulantes con la empresa y la vacante de la ruta', async () => {
    const response = {
      jobOfferId: OFFER_ID,
      jobTitle: 'DevOps Senior',
      total: 0,
      applicants: [],
    };
    const service = { listByOffer: vi.fn().mockResolvedValue(response) };
    const controller = new CompanyJobApplicantsController(
      service as unknown as CompanyJobApplicantsService,
    );

    await expect(controller.listByOffer(COMPANY_ID, OFFER_ID)).resolves.toEqual(
      response,
    );
    expect(service.listByOffer).toHaveBeenCalledWith(COMPANY_ID, OFFER_ID);
  });
});
