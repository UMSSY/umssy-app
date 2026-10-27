import { describe, expect, it } from 'vitest';
import { NLP_SOURCE_TEXT_MAX_LENGTH, NLP_VALIDATION_MESSAGES } from '../constants/nlp-validation.constants.js';
import { SkillValidationService } from '../services/skill-validation.service.js';
import type { NlpCatalogSkill } from '../types/nlp-catalog-skill.type.js';
import { validateSkillName } from '../utils/validate-skill-name.js';

const catalog: NlpCatalogSkill[] = [
  { id: 'skill-node', name: 'Node.js', areaId: 'desarrollo' },
  { id: 'skill-docker', name: 'Docker', areaId: 'cloud-devops' },
  { id: 'skill-html', name: 'HTML5', areaId: null },
  { id: 'skill-postgres', name: 'Postgres', areaId: 'data-ai' },
];

describe('validateSkillName', () => {
  it('accepts a valid name and corrects extra spaces', () => {
    expect(validateSkillName('  Spring    Boot ')).toEqual({ isValid: true, name: 'Spring Boot' });
    expect(validateSkillName('C++')).toEqual({ isValid: true, name: 'C++' });
    expect(validateSkillName('C#')).toEqual({ isValid: true, name: 'C#' });
  });

  it.each([
    ['', 'empty-name'],
    ['   ', 'empty-name'],
    ['a'.repeat(51), 'name-too-long'],
    ['Python<script>', 'invalid-characters'],
    ['1234', 'missing-letter'],
    ['Javaaaa', 'repeated-characters'],
  ])('discards "%s" because of %s', (name, reason) => {
    expect(validateSkillName(name)).toEqual({ isValid: false, reason });
  });

  it('treats a missing name as empty', () => {
    expect(validateSkillName(null as unknown as string)).toEqual({ isValid: false, reason: 'empty-name' });
  });

  it('has a message for every discard reason', () => {
    for (const message of Object.values(NLP_VALIDATION_MESSAGES)) {
      expect(message.length).toBeGreaterThan(0);
    }
  });
});

describe('SkillValidationService', () => {
  const service = new SkillValidationService();

  it('rejects a whole text over the limit instead of truncating it', () => {
    const validation = service.validateSources([
      { id: 'short', type: 'work-experience', text: 'Docker' },
      { id: 'long', type: 'education', text: 'x'.repeat(NLP_SOURCE_TEXT_MAX_LENGTH + 1) },
    ]);

    expect(validation.accepted.map((source) => source.id)).toEqual(['short']);
    expect(validation.rejected).toEqual([
      { id: 'long', type: 'education', reason: 'source-too-long', message: NLP_VALIDATION_MESSAGES['source-too-long'] },
    ]);
  });

  it('keeps detections that exist in the catalog with their catalog id', () => {
    const validation = service.validateDetected(
      [{ name: 'Node.js', evidenceRefs: [{ type: 'work-experience', id: 'b' }, { type: 'work-experience', id: 'a' }] }],
      catalog,
    );

    expect(validation.accepted).toEqual([
      {
        id: 'skill-node',
        name: 'Node.js',
        source: 'nlp',
        verificationStatus: 'pending',
        evidenceRefs: [{ type: 'work-experience', id: 'a' }, { type: 'work-experience', id: 'b' }],
      },
    ]);
    expect(validation.discarded).toEqual([]);
  });

  it('discards keywords that are not in the catalog', () => {
    const validation = service.validateDetected(
      [{ name: 'Kubernetes', evidenceRefs: [{ type: 'education', id: 'e1' }] }],
      catalog,
    );

    expect(validation.accepted).toEqual([]);
    expect(validation.discarded).toEqual([
      { name: 'Kubernetes', reason: 'not-in-catalog', message: NLP_VALIDATION_MESSAGES['not-in-catalog'] },
    ]);
  });

  it('matches a catalog entry written as one of the dictionary aliases', () => {
    const validation = service.validateDetected(
      [{ name: 'PostgreSQL', evidenceRefs: [{ type: 'education', id: 'e1' }] }],
      catalog,
    );
    expect(validation.accepted.map((skill) => [skill.id, skill.name])).toEqual([['skill-postgres', 'Postgres']]);
  });

  it('merges two detections that point to the same catalog skill', () => {
    const validation = service.validateDetected(
      [
        { name: 'HTML5', evidenceRefs: [{ type: 'education', id: 'e1' }] },
        { name: 'html5', evidenceRefs: [{ type: 'work-experience', id: 'w1' }] },
      ],
      catalog,
    );

    expect(validation.accepted).toHaveLength(1);
    expect(validation.accepted[0].evidenceRefs).toEqual([
      { type: 'education', id: 'e1' },
      { type: 'work-experience', id: 'w1' },
    ]);
  });

  it('discards a matching catalog skill whose stored name breaks the rules', () => {
    const validation = service.validateDetected(
      [{ name: 'Docker', evidenceRefs: [{ type: 'education', id: 'e1' }] }],
      [{ id: 'skill-docker', name: 'Dockér', areaId: null }],
    );

    expect(validation.accepted).toEqual([]);
    expect(validation.discarded).toEqual([
      { name: 'Docker', reason: 'invalid-characters', message: NLP_VALIDATION_MESSAGES['invalid-characters'] },
    ]);
  });

  it('corrects the spaces of a matching catalog name', () => {
    const validation = service.validateDetected(
      [{ name: 'Docker', evidenceRefs: [{ type: 'education', id: 'e1' }] }],
      [{ id: 'skill-docker', name: '  Docker  ', areaId: null }],
    );

    expect(validation.accepted.map((skill) => skill.name)).toEqual(['Docker']);
  });
});
