import { describe, it, expect, vi, afterEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { SkillDictionaryService } from '../services/skill-dictionary.service.js';
import { GapAnalysisService } from '../services/gap-analysis.service.js';
import { VacanciesService } from '../services/vacancies.service.js';
import { VacanciesRepository } from '../repositories/vacancies.repository.js';
import { JobConnectController } from '../controllers/job-connect.controller.js';
import {
  extractSkillsSchema,
  profileRequirementsSchema,
  vacanciesQuerySchema,
} from '../requests/job-connect.schema.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';

const dictionary = new SkillDictionaryService();
const gap = new GapAnalysisService(dictionary);

describe('Institutional and technical dictionary (#223)', () => {
  it('preserves compound terms and punctuation in technical names', () => {
    expect(
      dictionary.extract(
        'En la Universidad Mayor de San Simón: PYTHON, Python; Machine   Learning, C++, C#, .NET y Node.js.',
      ),
    ).toEqual({
      skills: ['Python', 'C++', 'C#', '.NET', 'Node.js', 'Machine Learning'],
      institutions: ['UMSS'],
    });
  });
  it('does not match substrings, adjectives, or institutions as skills', () => {
    expect(
      dictionary.extract(
        'JavaScript, proactivo, puntual, pythones y San Simón',
      ),
    ).toEqual({ skills: ['JavaScript'], institutions: ['UMSS'] });
  });
  it.each(['', 'el la de para proactivo puntual', 'javabeans mysql c++17'])(
    'handles text without recognized skills: %s',
    (text) => {
      expect(dictionary.extract(text).skills).toEqual([]);
    },
  );
  it('canonicalizes aliases and preserves unknown skills for comparison', () => {
    expect(dictionary.canonicalize(' JS ')).toBe('javascript');
    expect(dictionary.canonicalize(' Gestión  Ágil ')).toBe('gestion agil');
    expect(dictionary.canonicalize('C++')).not.toBe(
      dictionary.canonicalize('C#'),
    );
  });
});

describe('Gap analysis (#283)', () => {
  const requirements = {
    requiredSkills: ['Python', 'PYTHON', 'JS', 'C++', 'C#'],
    academicRequirements: ['Ingeniería de Sistemas'],
    otherRequirements: ['Carta de motivación'],
  };
  it('uses set difference, deduplicates skills and separates other requirements', () => {
    const result = gap.analyze(requirements, {
      skills: ['python', 'JavaScript', 'C++'],
      academicQualifications: ['Ingeniería Civil'],
      submittedRequirements: [],
    });
    expect(result.missingSkills).toEqual(['C#']);
    expect(result.skills).toHaveLength(4);
    expect(result.skills[0].status).toBe('Cumple');
    expect(result.academicRequirements[0].status).toBe('Pendiente');
    expect(result.otherRequirements[0].status).toBe('Pendiente');
    expect(result.complete).toBe(false);
    expect(result.message).toBeNull();
  });
  it('recalculates after profile changes and returns the complete message', () => {
    const result = gap.analyze(requirements, {
      skills: ['python', 'javascript', 'c++', 'c#'],
      academicQualifications: ['ingenieria de sistemas'],
      submittedRequirements: ['Carta de motivación'],
    });
    expect(result.complete).toBe(true);
    expect(result.missingSkills).toEqual([]);
    expect(result.message).toBe(
      'Para esta oportunidad no tienes habilidades ni requisitos pendientes',
    );
  });
  it('handles empty requirements and unknown skills without fuzzy matches', () => {
    const empty = {
      skills: [],
      academicQualifications: [],
      submittedRequirements: [],
    };
    expect(
      gap.analyze(
        { requiredSkills: [], academicRequirements: [], otherRequirements: [] },
        empty,
      ).complete,
    ).toBe(true);
    expect(
      gap.analyze(
        {
          requiredSkills: ['Rust', ' '],
          academicRequirements: [],
          otherRequirements: [],
        },
        empty,
      ).missingSkills,
    ).toEqual(['Rust']);
  });
});

describe('Active vacancies (#233)', () => {
  afterEach(() => vi.useRealTimers());
  it('filters inactive and expired vacancies in the database and paginates deterministically', async () => {
    vi.useFakeTimers();
    const now = new Date('2026-10-02T12:00:00Z');
    vi.setSystemTime(now);
    const vacancy = {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    };
    const repository = new VacanciesRepository({
      vacancy,
    } as unknown as PrismaService);
    expect(await repository.findActive(2, 10)).toEqual([]);
    expect(vacancy.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: 10,
      take: 10,
    });
    await repository.findActiveById('vacancy-id');
    expect(vacancy.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'vacancy-id',
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
  });
  it('exposes stored vacancies and analyzes their requirements', async () => {
    const vacancy = {
      requiredSkills: ['Python'],
      academicRequirements: [],
      otherRequirements: [],
    };
    const repository = {
      findActive: vi.fn().mockResolvedValue([vacancy]),
      findActiveById: vi.fn().mockResolvedValue(vacancy),
    };
    const service = new VacanciesService(
      repository as unknown as VacanciesRepository,
      gap,
    );
    const controller = new JobConnectController(service, dictionary);
    expect(await controller.findActive({ page: 1, limit: 20 })).toEqual([
      vacancy,
    ]);
    expect(repository.findActive).toHaveBeenCalledWith(1, 20);
    expect(
      await controller.analyzeGap('id', {
        skills: [],
        academicQualifications: [],
        submittedRequirements: [],
      }),
    ).toMatchObject({ vacancyId: 'id', missingSkills: ['Python'] });
    expect(controller.extract({ text: 'Scrum' }).skills).toEqual(['Scrum']);
    repository.findActiveById.mockResolvedValue(null);
    await expect(
      service.analyzeGap('missing', {
        skills: [],
        academicQualifications: [],
        submittedRequirements: [],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('Request validation', () => {
  it('accepts defaults and query strings', () => {
    expect(vacanciesQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
    expect(vacanciesQuerySchema.parse({ page: '2', limit: '10' })).toEqual({
      page: 2,
      limit: 10,
    });
    expect(profileRequirementsSchema.parse({ skills: [] })).toEqual({
      skills: [],
      academicQualifications: [],
      submittedRequirements: [],
    });
  });
  it.each([
    { page: 'oops' },
    { page: 0 },
    { page: 1.5 },
    { limit: 101 },
    { limit: [] },
  ])('rejects invalid pagination %j', (query) => {
    expect(vacanciesQuerySchema.safeParse(query).success).toBe(false);
  });
  it('rejects malformed and oversized bodies', () => {
    expect(
      extractSkillsSchema.safeParse({ text: 'x'.repeat(20001) }).success,
    ).toBe(false);
    expect(profileRequirementsSchema.safeParse({ skills: [' '] }).success).toBe(
      false,
    );
    expect(
      profileRequirementsSchema.safeParse({ skills: 'Python' }).success,
    ).toBe(false);
  });
});
