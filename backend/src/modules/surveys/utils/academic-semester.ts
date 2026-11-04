import { toUtcIso } from '../../../common/utils/date-time.js';
import {
  ACADEMIC_PERIOD_PATTERN,
  getAcademicPeriod,
} from '../../reports/utils/academic-period.js';
import { MAX_LISTED_SEMESTERS } from '../constants/survey-statistics.constants.js';
import type { SemesterRange } from '../types/semester-range.type.js';
import type {
  AcademicSemester,
  ParsedSemester,
} from '../types/survey-statistics.type.js';

function parsePeriod(period: string): ParsedSemester | undefined {
  if (!ACADEMIC_PERIOD_PATTERN.test(period)) return undefined;
  const [semester, year] = period.split('-');
  return { semester: semester as AcademicSemester, year: Number(year) };
}

export function getSemesterRange(period: string): SemesterRange | undefined {
  const parsed = parsePeriod(period);
  if (!parsed) return undefined;

  const { semester, year } = parsed;
  const startDate = semester === 'I' ? `${year}-01-01` : `${year}-07-01`;
  const endDate = semester === 'I' ? `${year}-07-01` : `${year + 1}-01-01`;

  return {
    start: new Date(toUtcIso(startDate, '00:00')),
    end: new Date(toUtcIso(endDate, '00:00')),
  };
}

export function getPreviousSemester(period: string): string | undefined {
  const parsed = parsePeriod(period);
  if (!parsed) return undefined;

  return parsed.semester === 'II'
    ? `I-${parsed.year}`
    : `II-${parsed.year - 1}`;
}

export function listSemesters(from: Date, to: Date): string[] {
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return [];

  const last = getAcademicPeriod(to.toISOString());
  let current = getAcademicPeriod(from.toISOString());
  if (!current || !last) return [];

  const semesters = [current];
  while (current !== last && semesters.length < MAX_LISTED_SEMESTERS) {
    const parsed = parsePeriod(current);
    if (!parsed) break;
    current =
      parsed.semester === 'I' ? `II-${parsed.year}` : `I-${parsed.year + 1}`;
    semesters.push(current);
  }

  return semesters.reverse();
}
