import { describe, expect, it } from 'vitest';
import { JobApplicationsService } from '../services/job-applications.service.js';
import { JobApplicationsService as MatchingJobApplicationsService } from '../../matching/services/job-applications.service.js';

describe('JobApplicationsService compatibility export', () => {
  it('exports the working matching service instead of the obsolete stub', () => {
    expect(JobApplicationsService).toBe(MatchingJobApplicationsService);
  });
});
