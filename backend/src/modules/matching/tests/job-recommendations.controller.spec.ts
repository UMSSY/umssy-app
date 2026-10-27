import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { JobRecommendationsController } from '../controllers/job-recommendations.controller.js';
import type { JobRecommendationsService } from '../services/job-recommendations.service.js';

describe('JobRecommendationsController', () => {
  it('protects the endpoint with authentication and roles', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, JobRecommendationsController),
    ).toEqual([JwtAuthGuard, RolesGuard]);
  });

  it('only allows the titulado and estudiante roles', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, JobRecommendationsController),
    ).toEqual(['titulado', 'estudiante']);
  });

  it('uses the authenticated user for the feed', async () => {
    const service = {
      recommendations: vi.fn().mockResolvedValue({ items: [] }),
    };
    const controller = new JobRecommendationsController(
      service as unknown as JobRecommendationsService,
    );
    await expect(controller.recommendations('user')).resolves.toEqual({
      items: [],
    });
    expect(service.recommendations).toHaveBeenCalledWith('user');
  });
});
