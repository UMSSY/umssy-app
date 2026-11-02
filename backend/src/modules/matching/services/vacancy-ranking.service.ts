import { Injectable } from '@nestjs/common';
import type { MatchingResult } from '../types/matching.types.js';
import { compareVacancyRank } from '../utils/compare-vacancy-rank.js';

type RankedVacancy = MatchingResult & {
  compatibility: number;
};

@Injectable()
export class VacancyRankingService {
  rank<T extends RankedVacancy>(vacancies: readonly T[]): T[] {
    return [...vacancies].sort((left, right) =>
      compareVacancyRank(
        { ...left, matchingSkills: left.matchedSkills.length },
        { ...right, matchingSkills: right.matchedSkills.length },
      ),
    );
  }
}
