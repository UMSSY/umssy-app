import { Injectable } from '@nestjs/common';
import { InvalidHeatmapRangeException } from '../exceptions/invalid-heatmap-range.exception.js';
import { toHeatmapGraduates } from '../mappers/heatmap-graduate.mapper.js';
import { HeatmapGraduatesRepository } from '../repositories/heatmap-graduates.repository.js';
import type { HeatmapQuery } from '../requests/heatmap-request.schema.js';
import type { HeatmapGraduateSource } from '../types/heatmap-graduate.types.js';
import type { HeatmapResponse, HeatmapType } from '../types/heatmap.types.js';
import { buildCareerHeatmap } from '../utils/build-career-heatmap.util.js';
import { buildEmployabilityHeatmap } from '../utils/build-employability-heatmap.util.js';
import { buildExperienceHeatmap } from '../utils/build-experience-heatmap.util.js';
import { buildSalaryHeatmap } from '../utils/build-salary-heatmap.util.js';
import { boliviaMonth, yearToRange } from '../utils/heatmap-dates.util.js';

@Injectable()
export class HeatmapsService {
  constructor(private readonly repository: HeatmapGraduatesRepository) {}

  async getHeatmap(
    type: HeatmapType,
    query: HeatmapQuery,
    now: Date = new Date(),
  ): Promise<HeatmapResponse> {
    const source = this.toSource(query);
    const [records, careers] = await Promise.all([
      this.repository.findEmploymentResponses(source),
      type === 'skills-by-career'
        ? this.repository.findCareers()
        : Promise.resolve([]),
    ]);
    const graduates = toHeatmapGraduates(records, now).filter(
      (graduate) =>
        query.month === undefined ||
        boliviaMonth(graduate.answeredAt) === query.month,
    );

    switch (type) {
      case 'skills-by-career':
        return buildCareerHeatmap(graduates, careers);
      case 'skills-by-salary':
        return buildSalaryHeatmap(graduates);
      case 'employability':
        return buildEmployabilityHeatmap(graduates);
      case 'skills-by-experience':
        return buildExperienceHeatmap(graduates);
    }
  }

  // El rango de semestres tiene prioridad sobre la gestión para evitar filtros contradictorios.
  private toSource(query: HeatmapQuery): HeatmapGraduateSource {
    if (query.startTimestamp && query.endTimestamp) {
      const from = new Date(query.startTimestamp);
      const to = new Date(query.endTimestamp);
      if (from > to) throw new InvalidHeatmapRangeException();
      return { careerId: query.careerId, from, to };
    }
    if (query.year !== undefined) {
      return { careerId: query.careerId, ...yearToRange(query.year) };
    }
    return { careerId: query.careerId };
  }
}
