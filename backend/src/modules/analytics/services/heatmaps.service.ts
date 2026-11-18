import { Injectable } from '@nestjs/common';
import { CareersService } from '../../surveys/services/careers.service.js';
import { InvalidHeatmapRangeException } from '../exceptions/invalid-heatmap-range.exception.js';
import type { HeatmapGraduateFilter } from '../types/heatmap-graduate-filter.types.js';
import type { HeatmapQuery } from '../types/heatmap-query.types.js';
import type { HeatmapResponse } from '../types/heatmap-response.types.js';
import type { HeatmapType } from '../types/heatmap-type.types.js';
import { buildCareerHeatmap } from '../utils/build-career-heatmap.util.js';
import { buildEmployabilityHeatmap } from '../utils/build-employability-heatmap.util.js';
import { buildExperienceHeatmap } from '../utils/build-experience-heatmap.util.js';
import { buildSalaryHeatmap } from '../utils/build-salary-heatmap.util.js';
import { boliviaMonth, yearToRange } from '../utils/heatmap-dates.util.js';
import { HeatmapGraduatesService } from './heatmap-graduates.service.js';

@Injectable()
export class HeatmapsService {
  constructor(
    private readonly heatmapGraduates: HeatmapGraduatesService,
    private readonly careers: CareersService,
  ) {}

  async getHeatmap(
    type: HeatmapType,
    query: HeatmapQuery,
    now: Date = new Date(),
  ): Promise<HeatmapResponse> {
    const [graduates, careers] = await Promise.all([
      this.heatmapGraduates.findGraduates(this.toGraduateFilter(query), now),
      type === 'skills-by-career'
        ? this.careers.listCareers('desc')
        : Promise.resolve([]),
    ]);
    const graduatesInMonth = graduates.filter(
      (graduate) =>
        query.month === undefined ||
        boliviaMonth(graduate.answeredAt) === query.month,
    );

    switch (type) {
      case 'skills-by-career':
        return buildCareerHeatmap(graduatesInMonth, careers, query.careerId);
      case 'skills-by-salary':
        return buildSalaryHeatmap(graduatesInMonth);
      case 'employability':
        return buildEmployabilityHeatmap(graduatesInMonth);
      case 'skills-by-experience':
        return buildExperienceHeatmap(graduatesInMonth);
    }
  }

  private toGraduateFilter(query: HeatmapQuery): HeatmapGraduateFilter {
    if (query.startTimestamp && query.endTimestamp) {
      return { careerId: query.careerId, ...this.toSemesterRange(query.startTimestamp, query.endTimestamp) };
    }
    if (query.year !== undefined) {
      return { careerId: query.careerId, ...yearToRange(query.year) };
    }
    return { careerId: query.careerId };
  }

  private toSemesterRange(
    startTimestamp: string,
    endTimestamp: string,
  ): { from: Date; to: Date } {
    const from = new Date(startTimestamp);
    const to = new Date(endTimestamp);
    if (from > to) throw new InvalidHeatmapRangeException();
    return { from, to };
  }
}
