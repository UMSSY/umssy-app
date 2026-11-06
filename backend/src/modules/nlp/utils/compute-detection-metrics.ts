import type { NlpDetectionMetrics } from '../types/nlp-detection-metrics.type.js';
import type { NlpDetectionSample } from '../types/nlp-detection-sample.type.js';

const ratio = (numerator: number, denominator: number) => (denominator === 0 ? null : numerator / denominator);

export function computeDetectionMetrics(samples: readonly NlpDetectionSample[]): NlpDetectionMetrics {
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  for (const sample of samples) {
    const expected = new Set(sample.expected);
    const predicted = new Set(sample.predicted);
    for (const skill of predicted) {
      if (expected.has(skill)) truePositives += 1;
      else falsePositives += 1;
    }
    for (const skill of expected) {
      if (!predicted.has(skill)) falseNegatives += 1;
    }
  }

  const precision = ratio(truePositives, truePositives + falsePositives);
  const recall = ratio(truePositives, truePositives + falseNegatives);
  const f1 =
    precision === null || recall === null || precision + recall === 0
      ? null
      : (2 * precision * recall) / (precision + recall);

  return { samples: samples.length, truePositives, falsePositives, falseNegatives, precision, recall, f1 };
}
