import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NLP_SKILL_DICTIONARY } from '../constants/nlp-dictionary.constants.js';
import type { NlpLabelledProfile } from '../types/nlp-labelled-profile.type.js';
import { computeDetectionMetrics } from '../utils/compute-detection-metrics.js';
import { evaluateDetectionQuality } from '../utils/evaluate-detection-quality.js';

const TARGET_PRECISION = 0.85;

const loadProfiles = (fileName: string): NlpLabelledProfile[] =>
  JSON.parse(readFileSync(new URL(`./fixtures/${fileName}`, import.meta.url), 'utf8')) as NlpLabelledProfile[];

const development = loadProfiles('nlp-development-profiles.json');
const evaluation = loadProfiles('nlp-evaluation-profiles.json');

describe('labelled profiles', () => {
  it('keep the development and the reserved evaluation profiles apart', () => {
    const texts = (profiles: readonly NlpLabelledProfile[]) => profiles.flatMap((profile) => profile.sources.map((source) => source.text));
    const evaluationTexts = new Set(texts(evaluation));
    expect(texts(development).filter((text) => evaluationTexts.has(text))).toEqual([]);
    expect(new Set([...development, ...evaluation].map((profile) => profile.id)).size).toBe(development.length + evaluation.length);
  });

  it('only use labels from the dictionary taxonomy', () => {
    const names = new Set(NLP_SKILL_DICTIONARY.map((entry) => entry.name));
    const labels = [...development, ...evaluation].flatMap((profile) => profile.expectedSkills);
    expect(labels.filter((label) => !names.has(label))).toEqual([]);
  });

  it('give the evaluation enough profiles and positive relations', () => {
    expect(evaluation.length).toBeGreaterThanOrEqual(20);
    expect(evaluation.flatMap((profile) => profile.expectedSkills).length).toBeGreaterThanOrEqual(100);
  });
});

describe('NLP detection quality', () => {
  it('reaches the target precision on the reserved evaluation profiles', () => {
    const metrics = evaluateDetectionQuality(evaluation);

    console.info('Synthetic evaluation metrics:', JSON.stringify(metrics));

    expect(metrics.precision).toBeGreaterThanOrEqual(TARGET_PRECISION);
  });

  it('stays above the target on the development profiles', () => {
    const metrics = evaluateDetectionQuality(development);

    console.info('Synthetic development metrics:', JSON.stringify(metrics));

    expect(metrics.precision).toBeGreaterThanOrEqual(TARGET_PRECISION);
  });
});

describe('computeDetectionMetrics', () => {
  it('counts each skill of a sample once', () => {
    expect(
      computeDetectionMetrics([
        { expected: ['Python', 'Docker'], predicted: ['Python', 'Python', 'Java'] },
        { expected: ['SQL'], predicted: [] },
      ]),
    ).toEqual({
      samples: 2,
      truePositives: 1,
      falsePositives: 1,
      falseNegatives: 2,
      precision: 0.5,
      recall: 1 / 3,
      f1: 0.4,
    });
  });

  it('does not report a precision without predictions', () => {
    expect(computeDetectionMetrics([{ expected: ['Python'], predicted: [] }])).toMatchObject({
      precision: null,
      recall: 0,
      f1: null,
    });
  });

  it('does not report a recall without expected skills', () => {
    expect(computeDetectionMetrics([{ expected: [], predicted: ['Python'] }])).toMatchObject({
      precision: 0,
      recall: null,
      f1: null,
    });
  });

  it('returns no metrics for no samples', () => {
    expect(computeDetectionMetrics([])).toEqual({
      samples: 0,
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      precision: null,
      recall: null,
      f1: null,
    });
  });

  it('reports a zero F1 as not computable when nothing is right', () => {
    expect(computeDetectionMetrics([{ expected: ['Python'], predicted: ['Java'] }]).f1).toBeNull();
  });
});
