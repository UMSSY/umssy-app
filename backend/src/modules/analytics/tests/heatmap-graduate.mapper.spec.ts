import { EMPLOYMENT_STATUS_QUESTION, MONTHLY_SALARY_QUESTION } from '../constants/heatmap.constants.js';
import { toHeatmapGraduates } from '../mappers/heatmap-graduate.mapper.js';
import { record } from './heatmap-fixtures.js';

const NOW = new Date('2026-01-01T00:00:00.000Z');

describe('toHeatmapGraduates', () => {
  it('traduce respuestas, habilidades NLP y experiencia del titulado', () => {
    const [graduate] = toHeatmapGraduates(
      [
        record({
          answers: [
            { question: { statement: EMPLOYMENT_STATUS_QUESTION }, option: { label: 'Independiente' } },
            { question: { statement: MONTHLY_SALARY_QUESTION }, option: { label: 'Más de Bs 12.000' } },
          ],
          respondent: {
            approvedAccessRequest: { careerId: 'career-informatics' },
            userSkills: [
              { source: 'nlp', skill: { id: 's1', name: 'SQL' } },
              { source: 'manual', skill: { id: 's2', name: 'Git' } },
            ],
            workExperiences: [{ startDate: new Date('2024-01-01'), endDate: null }],
          },
        }),
      ],
      NOW,
    );

    expect(graduate).toMatchObject({
      careerId: 'career-informatics',
      employmentStatus: 'self-employed',
      salaryRange: 'over-12000',
      experienceYears: 2,
      skills: [
        { id: 's1', name: 'SQL', isNlp: true },
        { id: 's2', name: 'Git', isNlp: false },
      ],
    });
  });

  it('conserva solo la respuesta más reciente y descarta usuarios sin carrera aprobada', () => {
    const graduates = toHeatmapGraduates(
      [
        record({ submittedAt: new Date('2024-01-01'), answers: [{ question: { statement: EMPLOYMENT_STATUS_QUESTION }, option: { label: 'Buscando empleo' } }] }),
        record({ submittedAt: new Date('2025-01-01'), answers: [{ question: { statement: EMPLOYMENT_STATUS_QUESTION }, option: { label: 'Empleado en su área' } }] }),
        record({ respondentId: 'user-2', respondent: { approvedAccessRequest: null, userSkills: [], workExperiences: [] } }),
      ],
      NOW,
    );

    expect(graduates).toHaveLength(1);
    expect(graduates[0]).toMatchObject({ employmentStatus: 'employed-in-field', salaryRange: null, experienceYears: null });
  });
});
