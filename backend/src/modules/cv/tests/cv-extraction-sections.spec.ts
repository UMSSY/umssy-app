import { describe, expect, it } from 'vitest';
import { detectCvSectionHeading } from '../utils/detect-cv-section-heading.js';
import { groupCvEntries } from '../utils/group-cv-entries.js';
import { splitCvLines } from '../utils/split-cv-lines.js';
import { splitCvSections } from '../utils/split-cv-sections.js';

describe('splitCvLines', () => {
  it('trims, collapses spaces and drops empty lines', () => {
    expect(splitCvLines('  Juan   Pérez \r\n\n  Cochabamba ')).toEqual([
      'Juan Pérez',
      'Cochabamba',
    ]);
  });

  it('returns an empty list for missing text', () => {
    expect(splitCvLines(undefined)).toEqual([]);
  });
});

describe('detectCvSectionHeading', () => {
  it.each([
    ['EXPERIENCIA LABORAL', 'experience'],
    ['Formación Académica:', 'education'],
    ['Datos personales', 'header'],
    ['Habilidades', 'other'],
  ])('maps "%s" to %s', (line, key) => {
    expect(detectCvSectionHeading(line)).toBe(key);
  });

  it('does not treat regular sentences as headings', () => {
    expect(detectCvSectionHeading('Experiencia en APIs REST')).toBeNull();
  });
});

describe('splitCvSections', () => {
  it('assigns each line to the section of the last heading', () => {
    expect(
      splitCvSections([
        'Juan Pérez',
        'EDUCACIÓN',
        'UMSS',
        'EXPERIENCIA',
        'Empresa SRL',
        'IDIOMAS',
        'Inglés',
      ]),
    ).toEqual({
      header: ['Juan Pérez'],
      education: ['UMSS'],
      experience: ['Empresa SRL'],
      other: ['Inglés'],
    });
  });
});

describe('groupCvEntries', () => {
  it('reads titles written above each date line', () => {
    expect(
      groupCvEntries([
        'Desarrollador Backend',
        'Tecnologías Andinas SRL',
        'Marzo 2021 - Actualidad',
        '• Diseño de APIs REST',
        '• Mantenimiento de bases de datos',
        'Analista de Sistemas',
        'Banco Unión',
        '2018 - 2020',
        '- Soporte a usuarios',
      ]),
    ).toEqual([
      {
        headerParts: ['Desarrollador Backend', 'Tecnologías Andinas SRL'],
        dateRange: { startDate: '2021-03-01', endDate: null, isCurrent: true },
        bodyLines: ['Diseño de APIs REST', 'Mantenimiento de bases de datos'],
      },
      {
        headerParts: ['Analista de Sistemas', 'Banco Unión'],
        dateRange: {
          startDate: '2018-01-01',
          endDate: '2020-01-01',
          isCurrent: false,
        },
        bodyLines: ['Soporte a usuarios'],
      },
    ]);
  });

  it('reads titles written below the date when the section starts with a date', () => {
    expect(
      groupCvEntries([
        '2019 - 2020',
        'Pasante',
        'Empresa SA',
        '- Pruebas manuales',
        '2020 - 2022',
        'QA Engineer',
        'Empresa SA',
      ]).map((entry) => entry.headerParts),
    ).toEqual([
      ['Pasante', 'Empresa SA'],
      ['QA Engineer', 'Empresa SA'],
    ]);
  });

  it('keeps undated content as a single entry', () => {
    expect(groupCvEntries(['Universidad Mayor de San Simón'])).toEqual([
      {
        headerParts: ['Universidad Mayor de San Simón'],
        dateRange: null,
        bodyLines: [],
      },
    ]);
  });

  it('returns no entries for an empty section', () => {
    expect(groupCvEntries([])).toEqual([]);
  });
});
