import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { JobRecommendationsController } from '../controllers/job-recommendations.controller.js';
import type { JobRecommendationsService } from '../services/job-recommendations.service.js';

describe('JobRecommendationsController', () => {
  it('protects both endpoints with authentication', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, JobRecommendationsController),
    ).toEqual([JwtAuthGuard]);
  });

  it('uses the authenticated user for the feed and the detail', async () => {
    const service = {
      recommendations: vi.fn().mockResolvedValue({ items: [] }),
      detail: vi.fn().mockResolvedValue({ score: 70 }),
    };
    const controller = new JobRecommendationsController(
      service as unknown as JobRecommendationsService,
    );
    await expect(controller.recommendations('user')).resolves.toEqual({
      items: [],
    });
    await expect(controller.detail('user', 'offer')).resolves.toEqual({
      score: 70,
    });
    expect(service.recommendations).toHaveBeenCalledWith('user');
    expect(service.detail).toHaveBeenCalledWith('user', 'offer');
  });
});
