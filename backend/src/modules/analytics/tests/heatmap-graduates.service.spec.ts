import type { ApprovedGraduateCareersService } from '../../access-requests/services/approved-graduate-careers.service.js';
import type { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import type { SurveyEmploymentResponsesService } from '../../surveys/services/survey-employment-responses.service.js';
import type { WorkExperienceSourcesService } from '../../work-experience/services/work-experience-sources.service.js';
import { HeatmapGraduatesService } from '../services/heatmap-graduates.service.js';
import { employmentResponse } from './heatmap-fixtures.js';

const NOW = new Date('2026-01-01T00:00:00.000Z');

function createService() {
  const employmentResponses = {
    findEmploymentResponses: vi.fn().mockResolvedValue([
      employmentResponse({ submittedAt: new Date('2024-01-01'), employmentStatusLabel: 'Buscando empleo' }),
      employmentResponse({ submittedAt: new Date('2025-01-01'), employmentStatusLabel: 'Empleado en su área' }),
      employmentResponse({ respondentId: 'user-2' }),
    ]),
  };
  const approvedCareers = {
    findByUserIds: vi.fn().mockResolvedValue([{ userId: 'user-1', careerId: 'career-systems' }]),
  };
  const skillAnalysis = {
    findSkillSummariesByUserIds: vi.fn().mockResolvedValue([
      { userId: 'user-1', skillId: 's1', skillName: 'SQL', source: 'manual' },
    ]),
  };
  const workExperienceSources = {
    findPeriodsByUserIds: vi.fn().mockResolvedValue([
      { userId: 'user-1', startDate: new Date('2025-01-01'), endDate: null },
    ]),
  };
  const service = new HeatmapGraduatesService(
    employmentResponses as unknown as SurveyEmploymentResponsesService,
    approvedCareers as unknown as ApprovedGraduateCareersService,
    skillAnalysis as unknown as SkillAnalysisService,
    workExperienceSources as unknown as WorkExperienceSourcesService,
  );
  return { employmentResponses, approvedCareers, skillAnalysis, workExperienceSources, service };
}

describe('HeatmapGraduatesService', () => {
  it('compone el titulado con datos de los dominios propietarios', async () => {
    const { employmentResponses, approvedCareers, skillAnalysis, workExperienceSources, service } =
      createService();
    const filter = { careerId: 'career-systems' };

    const graduates = await service.findGraduates(filter, NOW);

    expect(employmentResponses.findEmploymentResponses).toHaveBeenCalledWith(filter);
    expect(approvedCareers.findByUserIds).toHaveBeenCalledWith(['user-1', 'user-2']);
    expect(skillAnalysis.findSkillSummariesByUserIds).toHaveBeenCalledWith(['user-1', 'user-2']);
    expect(workExperienceSources.findPeriodsByUserIds).toHaveBeenCalledWith(['user-1', 'user-2']);
    expect(graduates).toEqual([
      {
        userId: 'user-1',
        careerId: 'career-systems',
        answeredAt: new Date('2025-01-01'),
        skills: [{ id: 's1', name: 'SQL', isNlp: false }],
        employmentStatus: 'employed-in-field',
        salaryRange: null,
        experienceYears: 1,
      },
    ]);
  });
});
