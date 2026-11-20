import type { CareersService } from '../../surveys/services/careers.service.js';
import { InvalidHeatmapRangeException } from '../exceptions/invalid-heatmap-range.exception.js';
import type { HeatmapGraduatesService } from '../services/heatmap-graduates.service.js';
import { HeatmapsService } from '../services/heatmaps.service.js';
import { SQL, graduate } from './heatmap-fixtures.js';

const employed = (userId: string, answeredAt: string) =>
  graduate({
    userId,
    answeredAt: new Date(answeredAt),
    employmentStatus: 'employed-in-field',
    skills: [SQL],
  });

function createService() {
  const heatmapGraduates = {
    findGraduates: vi.fn().mockResolvedValue([
      employed('u1', '2025-03-15T14:00:00.000Z'),
      employed('u2', '2025-07-01T02:00:00.000Z'),
    ]),
  };
  const careers = {
    listCareers: vi.fn().mockResolvedValue([
      { id: 'career-systems', title: 'Licenciatura en Ingeniería de Sistemas' },
    ]),
  };
  return {
    heatmapGraduates,
    careers,
    service: new HeatmapsService(
      heatmapGraduates as unknown as HeatmapGraduatesService,
      careers as unknown as CareersService,
    ),
  };
}

describe('HeatmapsService', () => {
  it('consulta sin rango de fechas cuando no hay filtros', async () => {
    const { heatmapGraduates, careers, service } = createService();
    const now = new Date('2026-01-01T00:00:00.000Z');
    const result = await service.getHeatmap('employability', {}, now);

    expect(heatmapGraduates.findGraduates).toHaveBeenCalledWith({ careerId: undefined }, now);
    expect(careers.listCareers).not.toHaveBeenCalled();
    expect(result.baseCount).toBe(2);
  });

  it('convierte la gestión a un rango anual en hora de Bolivia', async () => {
    const { heatmapGraduates, service } = createService();
    await service.getHeatmap('skills-by-experience', { year: 2025, careerId: 'career-systems' });

    expect(heatmapGraduates.findGraduates).toHaveBeenCalledWith(
      {
        careerId: 'career-systems',
        from: new Date('2025-01-01T04:00:00.000Z'),
        to: new Date('2026-01-01T03:59:59.999Z'),
      },
      expect.any(Date),
    );
  });

  it('usa el rango de semestres aunque también se envíe la gestión', async () => {
    const { heatmapGraduates, service } = createService();
    await service.getHeatmap('skills-by-salary', {
      year: 2020,
      startTimestamp: '2025-01-01T00:00:00-04:00',
      endTimestamp: '2025-06-30T23:59:59-04:00',
    });

    expect(heatmapGraduates.findGraduates).toHaveBeenCalledWith(
      {
        careerId: undefined,
        from: new Date('2025-01-01T04:00:00.000Z'),
        to: new Date('2025-07-01T03:59:59.000Z'),
      },
      expect.any(Date),
    );
  });

  it('rechaza rangos invertidos', async () => {
    const { service } = createService();
    await expect(
      service.getHeatmap('employability', {
        startTimestamp: '2025-07-01T00:00:00-04:00',
        endTimestamp: '2025-01-01T00:00:00-04:00',
      }),
    ).rejects.toBeInstanceOf(InvalidHeatmapRangeException);
  });

  it('filtra por mes en hora de Bolivia y carga las carreras en orden descendente', async () => {
    const { careers, service } = createService();
    const result = await service.getHeatmap('skills-by-career', { month: 6 });

    expect(careers.listCareers).toHaveBeenCalledWith('desc');
    expect(result.baseCount).toBe(1);
    expect(result.columns[0]).toMatchObject({ label: 'Ing. de Sistemas', sublabel: '(n = 1)' });
  });
});
