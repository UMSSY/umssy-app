import { describe, expect, it } from 'vitest';
import { CvExtractionMapper } from '../mappers/cv-extraction.mapper.js';

const cvId = '22222222-2222-4222-8222-222222222222';

const cvText = [
  'CURRICULUM VITAE',
  'CARLOS ANDRÉS MAMANI QUISPE',
  'carlos.mamani@gmail.com',
  'Celular: 71234567',
  'Cochabamba, Bolivia',
  'PERFIL PROFESIONAL',
  'Ingeniero de sistemas con experiencia en desarrollo web.',
  'FORMACIÓN ACADÉMICA',
  'Licenciatura en Ingeniería de Sistemas',
  'Universidad Mayor de San Simón (UMSS)',
  '2014 - 2019',
  'EXPERIENCIA LABORAL',
  'Desarrollador Full Stack | Tecnologías Andinas SRL',
  'Febrero 2021 - Actualidad',
  '• Desarrollo de APIs REST con NestJS',
  '• Migración de módulos a React',
  'Pasante de Sistemas',
  'Banco Unión',
  '01/2019 - 12/2020',
  '- Soporte técnico',
  'HABILIDADES',
  'TypeScript, SQL',
].join('\n');

const cities = [
  { id: 'city-lpz', title: 'La Paz' },
  { id: 'city-cbba', title: 'Cochabamba' },
];

const skills = [{ skillId: 'skill-ts', name: 'TypeScript' }];

describe('CvExtractionMapper', () => {
  const mapper = new CvExtractionMapper();

  it('structures contact, presentation, education, experience and skills', () => {
    expect(mapper.toResponse(cvId, cvText, { skills, cities })).toEqual({
      cvId,
      contact: {
        firstName: 'Carlos Andrés',
        lastName: 'Mamani Quispe',
        email: 'carlos.mamani@gmail.com',
        phone: '71234567',
        location: 'Cochabamba, Bolivia',
        cityId: 'city-cbba',
      },
      presentation: 'Ingeniero de sistemas con experiencia en desarrollo web.',
      educations: [
        {
          institution: 'Universidad Mayor de San Simón (UMSS)',
          degree: 'Licenciatura en Ingeniería de Sistemas',
          startDate: '2014-01-01',
          endDate: '2019-01-01',
          description: null,
        },
      ],
      workExperiences: [
        {
          companyName: 'Tecnologías Andinas SRL',
          position: 'Desarrollador Full Stack',
          startDate: '2021-02-01',
          endDate: null,
          isCurrent: true,
          description:
            'Desarrollo de APIs REST con NestJS\nMigración de módulos a React',
        },
        {
          companyName: 'Banco Unión',
          position: 'Pasante de Sistemas',
          startDate: '2019-01-01',
          endDate: '2020-12-01',
          isCurrent: false,
          description: 'Soporte técnico',
        },
      ],
      skills,
    });
  });

  it('returns empty data for text without recognizable content', () => {
    expect(mapper.toResponse(cvId, '12345', { skills: [], cities })).toEqual({
      cvId,
      contact: {
        firstName: null,
        lastName: null,
        email: null,
        phone: null,
        location: null,
        cityId: null,
      },
      presentation: null,
      educations: [],
      workExperiences: [],
      skills: [],
    });
  });

  it('joins the presentation lines without bullets and limits its length', () => {
    const longLine = 'a'.repeat(2100);
    const response = mapper.toResponse(
      cvId,
      ['Ana Rojas', 'SOBRE MÍ', '• Desarrolladora web', longLine].join('\n'),
      { skills: [], cities },
    );

    expect(response.presentation?.startsWith('Desarrolladora web a')).toBe(
      true,
    );
    expect(response.presentation).toHaveLength(2000);
  });
});
