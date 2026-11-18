import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { RequirementsController } from '../controllers/requirements.controller.js';
import type { RequirementTermsService } from '../services/requirement-terms.service.js';

describe('RequirementsController', () => {
  it('protege el controlador con JwtAuthGuard', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, RequirementsController)).toEqual([JwtAuthGuard, RolesGuard]);
  });

  it('delega la extraccion al metodo real y devuelve habilidades detectadas', async () => {
    const response = [{ id: 'skill-1', name: 'Python' }];
    const requirementTermsService = {
      extractAndMatchRequirements: vi.fn().mockResolvedValue(response),
    };
    const controller = new RequirementsController(
      requirementTermsService as unknown as RequirementTermsService,
    );

    await expect(controller.extractTerms({ text: 'Python' })).resolves.toEqual(response);
    expect(requirementTermsService.extractAndMatchRequirements).toHaveBeenCalledWith('Python');
  });
});
