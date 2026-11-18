import { Injectable } from '@nestjs/common';
import { ApprovedGraduateCareersService } from '../../access-requests/services/approved-graduate-careers.service.js';
import { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import { SurveyEmploymentResponsesService } from '../../surveys/services/survey-employment-responses.service.js';
import { WorkExperienceSourcesService } from '../../work-experience/services/work-experience-sources.service.js';
import { toHeatmapGraduates } from '../mappers/heatmap-graduate.mapper.js';
import type { HeatmapGraduate } from '../types/heatmap-graduate.types.js';
import type { HeatmapGraduateFilter } from '../types/heatmap-graduate-filter.types.js';
import { selectLatestResponsePerRespondent } from '../utils/select-latest-responses.util.js';

@Injectable()
export class HeatmapGraduatesService {
  constructor(
    private readonly employmentResponses: SurveyEmploymentResponsesService,
    private readonly approvedCareers: ApprovedGraduateCareersService,
    private readonly skillAnalysis: SkillAnalysisService,
    private readonly workExperienceSources: WorkExperienceSourcesService,
  ) {}

  async findGraduates(
    filter: HeatmapGraduateFilter,
    now: Date,
  ): Promise<HeatmapGraduate[]> {
    const responses = selectLatestResponsePerRespondent(
      await this.employmentResponses.findEmploymentResponses(filter),
    );
    const userIds = responses.map((response) => response.respondentId);
    const [careers, skills, workPeriods] = await Promise.all([
      this.approvedCareers.findByUserIds(userIds),
      this.skillAnalysis.findSkillSummariesByUserIds(userIds),
      this.workExperienceSources.findPeriodsByUserIds(userIds),
    ]);
    return toHeatmapGraduates({ responses, careers, skills, workPeriods }, now);
  }
}
