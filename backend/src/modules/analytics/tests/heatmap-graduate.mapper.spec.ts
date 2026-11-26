import { toHeatmapGraduates } from '../mappers/heatmap-graduate.mapper.js';
import { selectLatestResponsePerRespondent } from '../utils/select-latest-responses.util.js';
import { employmentResponse } from './heatmap-fixtures.js';

const NOW = new Date('2026-01-01T00:00:00.000Z');

describe('toHeatmapGraduates', () => {
  it('traduce respuestas, habilidades NLP y experiencia del titulado', () => {
    const [graduate] = toHeatmapGraduates(
      {
        responses: [
          employmentResponse({
            employmentStatusLabel: 'Independiente',
            monthlySalaryLabel: 'Más de Bs 12.000',
          }),
        ],
        careers: [{ userId: 'user-1', careerId: 'career-informatics' }],
        skills: [
          { userId: 'user-1', skillId: 's1', skillName: 'SQL', source: 'nlp' },
          { userId: 'user-1', skillId: 's2', skillName: 'Git', source: 'manual' },
          { userId: 'user-2', skillId: 's3', skillName: 'Java', source: 'manual' },
        ],
        workPeriods: [
          { userId: 'user-1', startDate: new Date('2024-01-01'), endDate: null },
        ],
      },
      NOW,
    );

    expect(graduate).toMatchObject({
      userId: 'user-1',
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

  it('descarta titulados sin carrera aprobada y etiquetas desconocidas', () => {
    const graduates = toHeatmapGraduates(
      {
        responses: [
          employmentResponse({ employmentStatusLabel: 'Otra opción' }),
          employmentResponse({ respondentId: 'user-2' }),
        ],
        careers: [{ userId: 'user-1', careerId: 'career-systems' }],
        skills: [],
        workPeriods: [],
      },
      NOW,
    );

    expect(graduates).toHaveLength(1);
    expect(graduates[0]).toMatchObject({
      employmentStatus: null,
      salaryRange: null,
      experienceYears: null,
      skills: [],
    });
  });
});

describe('selectLatestResponsePerRespondent', () => {
  it('conserva solo la respuesta más reciente de cada titulado', () => {
    const latest = selectLatestResponsePerRespondent([
      employmentResponse({ submittedAt: new Date('2025-01-01'), employmentStatusLabel: 'Empleado en su área' }),
      employmentResponse({ submittedAt: new Date('2024-01-01'), employmentStatusLabel: 'Buscando empleo' }),
      employmentResponse({ respondentId: 'user-2' }),
    ]);

    expect(latest).toHaveLength(2);
    expect(latest[0]?.employmentStatusLabel).toBe('Empleado en su área');
  });
});
