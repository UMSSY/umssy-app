import type { RadarReviewRepository } from '../repositories/radar-review.repository.js';

import type { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';

export type ReviewQueueRows = [
  Awaited<ReturnType<RadarReviewRepository['listReviewQueue']>>,
  Awaited<ReturnType<SkillAnalysisService['listReviewQueue']>>,
];
