import { SkillDetectionService } from '../services/skill-detection.service.js';
import type { NlpDetectionMetrics } from '../types/nlp-detection-metrics.type.js';
import type { NlpLabelledProfile } from '../types/nlp-labelled-profile.type.js';
import { computeDetectionMetrics } from './compute-detection-metrics.js';

// Evaluates the actual detector before catalog validation or consolidation with manual skills.
export function evaluateDetectionQuality(
  profiles: readonly NlpLabelledProfile[],
): NlpDetectionMetrics {
  const detector = new SkillDetectionService();
  const samples = profiles.map((profile) => ({
    expected: profile.expectedSkills,
    predicted: detector
      .detect({
        userId: profile.id,
        sources: profile.sources.map((source, index) => ({
          id: `${profile.id}-${index}`,
          ...source,
        })),
      })
      .map((candidate) => candidate.name),
  }));

  return computeDetectionMetrics(samples);
}
