import { Injectable } from '@nestjs/common';
import { compareVacancyRank } from '../utils/compare-vacancy-rank.js';

interface RankedVacancy {
  id: string;
  compatibility: number;
  publishedAt: Date;
}

@Injectable()
export class VacancyRankingService {
  rank<T extends RankedVacancy>(vacancies: readonly T[]): T[] {
    return [...vacancies].sort(compareVacancyRank);
  }
}
