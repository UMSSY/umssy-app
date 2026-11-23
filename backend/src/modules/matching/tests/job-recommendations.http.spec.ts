import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { JobRecommendationsController } from '../controllers/job-recommendations.controller.js';
import { JobMatchController } from '../controllers/job-match.controller.js';

describe('R15: endpoint unico de afinidad', () => {
  it('mantiene GET /job-offers/:id/match solo en JobMatchController', () => {
    expect(Reflect.getMetadata(PATH_METADATA, JobMatchController.prototype.getMatch)).toBe(':id/match');
    expect(Reflect.getMetadata(METHOD_METADATA, JobMatchController.prototype.getMatch)).toBe(RequestMethod.GET);
    expect('getJobFit' in JobRecommendationsController.prototype).toBe(false);
  });
});
