import { EMPLOYMENT_STATUS_QUESTION } from '../constants/heatmap.constants.js';
import { InvalidHeatmapRangeException } from '../exceptions/invalid-heatmap-range.exception.js';
import type { HeatmapGraduatesRepository } from '../repositories/heatmap-graduates.repository.js';
import { HeatmapsService } from '../services/heatmaps.service.js';
import { record } from './heatmap-fixtures.js';

const employed = (respondentId: string, submittedAt: string) =>
  record({
    respondentId,
    submittedAt: new Date(submittedAt),
    answers: [{ question: { statement: EMPLOYMENT_STATUS_QUESTION }, option: { label: 'Empleado en su área' } }],
    respondent: {
      approvedAccessRequest: { careerId: 'career-systems' },
      userSkills: [{ source: 'manual', skill: { id: 's1', name: 'SQL' } }],
      workExperiences: [],
    },
  });

function createService() {
  const repository = {
    findEmploymentResponses: vi.fn().mockResolvedValue([
      employed('u1', '2025-03-15T14:00:00.000Z'),
      employed('u2', '2025-07-01T02:00:00.000Z'),
    ]),
    findCareers: vi.fn().mockResolvedValue([{ id: 'career-systems', title: 'Licenciatura en Ingeniería de Sistemas' }]),
  };
  return { repository, service: new HeatmapsService(repository as unknown as HeatmapGraduatesRepository) };
}

describe('HeatmapsService', () => {
  it('consulta sin rango de fechas cuando no hay filtros', async () => {
    const { repository, service } = createService();
    const result = await service.getHeatmap('employability', {});

    expect(repository.findEmploymentResponses).toHaveBeenCalledWith({ careerId: undefined, promotion: undefined });
    expect(repository.findCareers).not.toHaveBeenCalled();
    expect(result.baseCount).toBe(2);
  });

  it('pasa la promoción al repository cuando se filtra por año de egreso', async () => {
    const { repository, service } = createService();
    await service.getHeatmap('employability', { careerId: 'career-systems', promotion: 2023 });

    expect(repository.findEmploymentResponses).toHaveBeenCalledWith({
      careerId: 'career-systems',
      promotion: 2023,
    });
  });

  it('pasa promoción undefined cuando no se filtra por promoción', async () => {
    const { repository, service } = createService();
    await service.getHeatmap('employability', { careerId: 'career-systems' });

    expect(repository.findEmploymentResponses).toHaveBeenCalledWith({
      careerId: 'career-systems',
      promotion: undefined,
    });
  });

  it('convierte la gestión a un rango anual en hora de Bolivia', async () => {
    const { repository, service } = createService();
    await service.getHeatmap('skills-by-experience', { year: 2025, careerId: 'career-systems' });

    expect(repository.findEmploymentResponses).toHaveBeenCalledWith({
      careerId: 'career-systems',
      from: new Date('2025-01-01T04:00:00.000Z'),
      to: new Date('2026-01-01T03:59:59.999Z'),
    });
  });

  it('prioriza el rango de semestres sobre la gestión', async () => {
    const { repository, service } = createService();
    await service.getHeatmap('skills-by-salary', {
      year: 2020,
      startTimestamp: '2025-01-01T00:00:00-04:00',
      endTimestamp: '2025-06-30T23:59:59-04:00',
    });

    expect(repository.findEmploymentResponses).toHaveBeenCalledWith({
      careerId: undefined,
      from: new Date('2025-01-01T04:00:00.000Z'),
      to: new Date('2025-07-01T03:59:59.000Z'),
    });
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

  it('filtra por mes en hora de Bolivia y carga las carreras para HU5', async () => {
    const { repository, service } = createService();
    const result = await service.getHeatmap('skills-by-career', { month: 6 });

    expect(repository.findCareers).toHaveBeenCalled();
    expect(result.baseCount).toBe(1);
    expect(result.columns[0]?.label).toBe('Ing. de Sistemas (n=1)');
  });
});
