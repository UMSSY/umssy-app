import {
  CV_DATE_RANGE_PATTERN,
  CV_MONTH_NUMBERS,
  CV_REMAINDER_EDGE_PATTERN,
  CV_SINGLE_DATE_PATTERN,
} from '../constants/cv-extraction.constants.js';
import type { CvDateMatch } from '../types/cv-date-match.type.js';
import { toCvIsoDate } from './to-cv-iso-date.js';

function readMonth(
  groups: Record<string, string | undefined>,
  prefix: string,
): number | undefined {
  const name = groups[`${prefix}MonthName`]?.toLowerCase();
  const number = groups[`${prefix}MonthNumber`];
  if (name) return CV_MONTH_NUMBERS[name];
  return number ? Number(number) : undefined;
}

function readDate(
  groups: Record<string, string | undefined>,
  prefix: string,
): string | null {
  return toCvIsoDate(groups[`${prefix}Year`], readMonth(groups, prefix));
}

function removeMatch(line: string, match: RegExpExecArray): string {
  return `${line.slice(0, match.index)} ${line.slice(match.index + match[0].length)}`
    .replace(/\s+/g, ' ')
    .replace(CV_REMAINDER_EDGE_PATTERN, '');
}

export function parseCvDateRange(
  line: string,
  allowSingleDate = false,
): CvDateMatch | null {
  const range = CV_DATE_RANGE_PATTERN.exec(line);
  if (range?.groups) {
    const isCurrent = Boolean(range.groups.current);
    return {
      range: {
        startDate: readDate(range.groups, 'start'),
        endDate: isCurrent ? null : readDate(range.groups, 'end'),
        isCurrent,
      },
      remainder: removeMatch(line, range),
    };
  }
  if (!allowSingleDate) return null;
  const single = CV_SINGLE_DATE_PATTERN.exec(line);
  if (!single?.groups) return null;
  return {
    range: {
      startDate: null,
      endDate: readDate(single.groups, 'single'),
      isCurrent: false,
    },
    remainder: removeMatch(line, single),
  };
}
