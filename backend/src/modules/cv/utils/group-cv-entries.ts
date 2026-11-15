import {
  CV_ENTRY_HEADER_MAX_LINES,
  CV_MAX_ENTRIES,
} from '../constants/cv-extraction.constants.js';
import type { CvDateRange } from '../types/cv-date-range.type.js';
import type { CvDatedLine } from '../types/cv-dated-line.type.js';
import type { CvTextEntry } from '../types/cv-text-entry.type.js';
import { parseCvDateRange } from './parse-cv-date-range.js';
import { splitCvParts } from './split-cv-parts.js';
import { isCvBulletLine, stripCvBullet } from './strip-cv-bullet.js';

function countLeadingHeaderLines(lines: readonly string[]): number {
  const window = lines.slice(0, CV_ENTRY_HEADER_MAX_LINES);
  const firstBullet = window.findIndex(isCvBulletLine);
  return firstBullet === -1 ? window.length : firstBullet;
}

function countTrailingHeaderLines(lines: readonly string[]): number {
  return countLeadingHeaderLines([...lines].reverse());
}

function toEntry(
  headerParts: readonly string[],
  dateRange: CvDateRange | null,
  followingLines: readonly string[],
): CvTextEntry {
  const borrowed =
    headerParts.length > 0 ? 0 : countLeadingHeaderLines(followingLines);
  return {
    headerParts: [
      ...headerParts,
      ...followingLines.slice(0, borrowed).flatMap(splitCvParts),
    ],
    dateRange,
    bodyLines: followingLines
      .slice(borrowed)
      .map(stripCvBullet)
      .filter((line) => line.length > 0),
  };
}

function findDatedLines(
  lines: readonly string[],
  allowSingleDate: boolean,
): CvDatedLine[] {
  return lines.flatMap((line, index) => {
    const match = parseCvDateRange(line, allowSingleDate);
    return match ? [{ index, match }] : [];
  });
}

function groupWithHeaderBelowDate(
  lines: readonly string[],
  dated: readonly CvDatedLine[],
): CvTextEntry[] {
  return dated.map((item, position) =>
    toEntry(
      splitCvParts(item.match.remainder),
      item.match.range,
      lines.slice(item.index + 1, dated[position + 1]?.index ?? lines.length),
    ),
  );
}

function groupWithHeaderAboveDate(
  lines: readonly string[],
  dated: readonly CvDatedLine[],
): CvTextEntry[] {
  const headerStarts = dated.map((item, position) => {
    const floor = position === 0 ? 0 : dated[position - 1].index + 1;
    return (
      item.index - countTrailingHeaderLines(lines.slice(floor, item.index))
    );
  });
  return dated.map((item, position) =>
    toEntry(
      [
        ...lines
          .slice(headerStarts[position], item.index)
          .flatMap(splitCvParts),
        ...splitCvParts(item.match.remainder),
      ],
      item.match.range,
      lines.slice(item.index + 1, headerStarts[position + 1] ?? lines.length),
    ),
  );
}

export function groupCvEntries(
  lines: readonly string[],
  allowSingleDate = false,
): CvTextEntry[] {
  const dated = findDatedLines(lines, allowSingleDate);
  if (dated.length === 0)
    return lines.length > 0 ? [toEntry([], null, lines)] : [];
  const isHeaderBelowDate = dated[0].index === 0 && !dated[0].match.remainder;
  const entries = isHeaderBelowDate
    ? groupWithHeaderBelowDate(lines, dated)
    : groupWithHeaderAboveDate(lines, dated);
  return entries.slice(0, CV_MAX_ENTRIES);
}
