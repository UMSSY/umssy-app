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

describe('CvExtractionMapper', () => {
  const mapper = new CvExtractionMapper();

  it('structures contact data, education and work experience', () => {
    expect(mapper.toResponse(cvId, cvText)).toEqual({
      cvId,
      contact: {
        firstName: 'Carlos Andrés',
        lastName: 'Mamani Quispe',
        email: 'carlos.mamani@gmail.com',
        phone: '71234567',
        location: 'Cochabamba, Bolivia',
      },
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
    });
  });

  it('returns empty data for text without recognizable content', () => {
    expect(mapper.toResponse(cvId, '12345')).toEqual({
      cvId,
      contact: {
        firstName: null,
        lastName: null,
        email: null,
        phone: null,
        location: null,
      },
      educations: [],
      workExperiences: [],
    });
  });
});
