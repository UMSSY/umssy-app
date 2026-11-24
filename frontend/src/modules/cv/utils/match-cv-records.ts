import { CV_YEAR_MONTH_LENGTH } from "../constants/cv-record-match.constants";
import type { CvRecordMatch } from "../types/cv-record-match.types";
import type { CvRecordMatcher } from "../types/cv-record-matcher.types";

const toYearMonth = (date: string | null | undefined): string => (date ?? "").slice(0, CV_YEAR_MONTH_LENGTH);

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

  const pairByStartDate = (toComparableDate: (date: string | null | undefined) => string) =>
    extracted.forEach((item, index) => {
      const startDate = toComparableDate(matcher.getExtractedStartDate(item));
      if (paired[index] || !startDate) return;
      pair(index, findCandidates(item).find((record) => toComparableDate(record.startDate) === startDate));
    });

  pairByStartDate((date) => date ?? "");
  pairByStartDate(toYearMonth);

  return extracted.map((item, index) => {
    const record = paired[index];
    if (!record) return { status: "new" };
    return { status: matcher.isChanged(item, record) ? "changed" : "same", record };
  });
}
