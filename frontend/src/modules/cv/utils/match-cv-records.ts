import { CV_YEAR_MONTH_LENGTH } from "../constants/cv-record-match.constants";
import type { CvRecordMatch } from "../types/cv-record-match.types";
import type { CvRecordMatcher } from "../types/cv-record-matcher.types";

const toYearMonth = (date: string | null | undefined): string => (date ?? "").trim().slice(0, CV_YEAR_MONTH_LENGTH);

const isMonthPrecision = (date: string | null | undefined): boolean => {
  const value = (date ?? "").trim();
  return value.length > 0 && value.length <= CV_YEAR_MONTH_LENGTH;
};

export function matchCvRecords<TExtracted, TRecord extends { id: string; startDate: string }>(
  items: readonly TExtracted[] | null | undefined,
  records: readonly TRecord[] | null | undefined,
  matcher: CvRecordMatcher<TExtracted, TRecord>,
): CvRecordMatch<TRecord>[] {
  const extracted = items ?? [];
  const usedIds = new Set<string>();
  const paired: (TRecord | undefined)[] = extracted.map(() => undefined);

  const findCandidates = (item: TExtracted): TRecord[] => {
    const key = matcher.toExtractedKey(item);
    if (key === null) return [];
    return (records ?? []).filter((record) => !usedIds.has(record.id) && matcher.toRecordKey(record) === key);
  };

  const pair = (index: number, record: TRecord | undefined) => {
    if (!record) return;
    paired[index] = record;
    usedIds.add(record.id);
  };

  extracted.forEach((item, index) => {
    const startDate = (matcher.getExtractedStartDate(item) ?? "").trim();
    if (paired[index] || !startDate) return;
    pair(index, findCandidates(item).find((record) => (record.startDate ?? "").trim() === startDate));
  });

  extracted.forEach((item, index) => {
    if (paired[index]) return;
    const extractedStartDate = matcher.getExtractedStartDate(item);
    const extractedMonth = toYearMonth(extractedStartDate);
    if (!extractedMonth) return;

    const matchingCandidates = findCandidates(item).filter((record) => {
      const isMonthCompatible = isMonthPrecision(extractedStartDate) || isMonthPrecision(record.startDate);
      return isMonthCompatible && toYearMonth(record.startDate) === extractedMonth;
    });

    if (matchingCandidates.length === 1) {
      pair(index, matchingCandidates[0]);
    }
  });

  return extracted.map((item, index) => {
    const record = paired[index];
    if (!record) return { status: "new" };
    return { status: matcher.isChanged(item, record) ? "changed" : "same", record };
  });
}
