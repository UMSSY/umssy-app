import { Injectable, NotFoundException } from '@nestjs/common';
import { VacanciesRepository } from '../repositories/vacancies.repository.js';
import { GapAnalysisService } from './gap-analysis.service.js';
import type { profileRequirementsSchema } from '../requests/job-connect.schema.js';

@Injectable()
export class VacanciesService {
  constructor(
    private readonly repository: VacanciesRepository,
    private readonly gapAnalysis: GapAnalysisService,
  ) {}

  findActive(page: number, limit: number) {
    return this.repository.findActive(page, limit);
  }

  async analyzeGap(
    id: string,
    profile: ReturnType<typeof profileRequirementsSchema.parse>,
  ) {
    const vacancy = await this.repository.findActiveById(id);
    if (!vacancy) throw new NotFoundException('Vacante activa no encontrada');
    return { vacancyId: id, ...this.gapAnalysis.analyze(vacancy, profile) };
  }
}
