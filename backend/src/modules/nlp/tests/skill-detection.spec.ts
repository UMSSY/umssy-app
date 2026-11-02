import { describe, expect, it } from 'vitest';
import { NLP_DICTIONARY_VERSION, NLP_SKILL_DICTIONARY } from '../constants/nlp-dictionary.constants.js';
import { SkillDetectionService } from '../services/skill-detection.service.js';
import { buildAliasIndex } from '../utils/build-alias-index.js';
import { detectSkillMentions } from '../utils/detect-skill-mentions.js';
import { toContentWords } from '../utils/to-content-words.js';

const index = buildAliasIndex(NLP_SKILL_DICTIONARY);
const detect = (text: string) => detectSkillMentions(text, index);

describe('skill dictionary', () => {
  it('is versioned', () => {
    expect(NLP_DICTIONARY_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('never assigns the same alias to two skills', () => {
    const owners = new Map<string, string>();
    for (const entry of NLP_SKILL_DICTIONARY) {
      for (const alias of [...entry.aliases, ...(entry.ambiguousAliases ?? [])]) {
        const key = toContentWords(alias).join(' ');
        expect(owners.get(key) ?? entry.name, `alias "${alias}"`).toBe(entry.name);
        owners.set(key, entry.name);
      }
    }
  });

  it('has unique canonical names', () => {
    const names = NLP_SKILL_DICTIONARY.map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('buildAliasIndex', () => {
  it('tries the longest alias first', () => {
    const lengths = (index.get('react') ?? []).map((pattern) => pattern.tokens.length);
    expect(lengths).toEqual([...lengths].sort((first, second) => second - first));
    expect(index.get('react')?.at(-1)?.tokens).toEqual(['react']);
  });

  it('skips aliases made only of stopwords', () => {
    const emptyIndex = buildAliasIndex([{ name: 'Nothing', aliases: ['de la'] }]);
    expect(emptyIndex.size).toBe(0);
  });
});

describe('detectSkillMentions', () => {
  it('detects canonical skills in a work description', () => {
    expect(detect('Desarrollé microservicios con Node.js, Docker y PostgreSQL.')).toEqual([
      'Node.js',
      'Docker',
      'PostgreSQL',
    ]);
  });

  it('keeps technical symbols and multiword names', () => {
    expect(detect('Programé en C++ y C#; también usé .NET Core y Spring Boot.')).toEqual([
      'C++',
      'C#',
      '.NET',
      'Spring Boot',
    ]);
  });

  it('tells Java and JavaScript apart and prefers the longest alias', () => {
    expect(detect('Java en el backend y JavaScript con React Native en el móvil.')).toEqual([
      'Java',
      'JavaScript',
      'React Native',
    ]);
  });

  it('counts a repeated mention once', () => {
    expect(detect('Python, python y PYTHON3 en todos los proyectos')).toEqual(['Python']);
  });

  it('matches aliases written with spaces or accents', () => {
    expect(detect('Usé node js y vue js; aprendizaje automático con TensorFlow')).toEqual([
      'Node.js',
      'Vue.js',
      'Machine Learning',
      'TensorFlow',
    ]);
  });

  it('ignores negated mentions only inside their clause', () => {
    expect(detect('No tengo experiencia con Java, pero sí con Python.')).toEqual(['Python']);
    expect(detect('No uso Java ni Docker')).toEqual([]);
    expect(detect('Sin experiencia en Docker. Uso Linux a diario.')).toEqual(['Linux']);
    expect(detect('Nunca trabajé con Angular aunque usé React')).toEqual(['React']);
  });

  it('does not read "no solo" or "sin embargo" as negations', () => {
    expect(detect('No solo usé Java sino también Spring Boot.')).toEqual(['Java', 'Spring Boot']);
    expect(detect('Sin embargo, desarrollé APIs con FastAPI')).toEqual(['FastAPI']);
  });

  it('keeps "sin" only for knowledge or a skill right after it', () => {
    expect(detect('Implementé pruebas sin errores con Jest')).toEqual(['Jest']);
    expect(detect('Un despliegue sin Docker, solo con Kubernetes')).toEqual(['Kubernetes']);
    expect(detect('without experience in Rust')).toEqual([]);
  });

  it('ignores the wish to learn a technology', () => {
    expect(detect('Quiero aprender Kubernetes el próximo año.')).toEqual([]);
    expect(detect('Me gustaría aprender más sobre Terraform; uso Ansible')).toEqual(['Ansible']);
    expect(detect('Aprendí Python en la universidad')).toEqual(['Python']);
  });

  it('needs a technical context for ambiguous aliases', () => {
    expect(detect('Transferencias SWIFT y conciliaciones bancarias.')).toEqual([]);
    expect(detect('Fotografía de pandas en el zoológico')).toEqual([]);
    expect(detect('Desarrollo backend en Go')).toEqual(['Go']);
    expect(detect('Análisis con Pandas y Python')).toEqual(['Pandas', 'Python']);
  });

  it('respects the terms that block an alias', () => {
    expect(detect('La piedra angular del proyecto de software fue el equipo.')).toEqual([]);
    expect(detect('Frontend con Angular y Vue.js')).toEqual(['Angular', 'Vue.js']);
  });

  it('never joins words across punctuation', () => {
    expect(detect('Uso Spring. Boot camp de liderazgo')).toEqual([]);
  });

  it('returns nothing for texts without technical skills', () => {
    expect(detect('Atención al cliente, liderazgo y trabajo en equipo.')).toEqual([]);
    expect(detect('')).toEqual([]);
  });
});

describe('SkillDetectionService', () => {
  const service = new SkillDetectionService();

  it('groups the evidence of each skill by source', () => {
    const candidates = service.detect({
      userId: 'user-1',
      sources: [
        { id: 'experience-1', type: 'work-experience', text: 'APIs en Node.js con Docker' },
        { id: 'education-1', type: 'education', text: 'Proyecto de grado con Docker y Python' },
      ],
    });

    expect(candidates).toEqual([
      { name: 'Node.js', evidenceRefs: [{ type: 'work-experience', id: 'experience-1' }] },
      {
        name: 'Docker',
        evidenceRefs: [
          { type: 'work-experience', id: 'experience-1' },
          { type: 'education', id: 'education-1' },
        ],
      },
      { name: 'Python', evidenceRefs: [{ type: 'education', id: 'education-1' }] },
    ]);
  });

  it('returns no candidates without sources', () => {
    expect(service.detect({ userId: 'user-1', sources: [] })).toEqual([]);
  });
});
