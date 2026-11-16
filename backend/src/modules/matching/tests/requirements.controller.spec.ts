import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RequirementsController } from '../controllers/requirements.controller.js';
import type { RequirementTermsService } from '../services/requirement-terms.service.js';

describe('RequirementsController', () => {
  it('protege el controlador con JwtAuthGuard', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, RequirementsController)).toEqual([JwtAuthGuard]);
  });

  it('delega la extraccion al servicio con el texto del body', () => {
    const response = { tokens: ['python'], terms: ['python'], skills: ['Python'], institutions: [] };
    const requirementTermsService = { extract: vi.fn().mockReturnValue(response) };
    const controller = new RequirementsController(
      requirementTermsService as unknown as RequirementTermsService,
    );

    const result = controller.extractTerms({ text: 'Python' });

    expect(requirementTermsService.extract).toHaveBeenCalledWith('Python');
    expect(result).toEqual(response);
  });
});
