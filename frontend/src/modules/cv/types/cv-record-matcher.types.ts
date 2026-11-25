export interface CvRecordMatcher<TExtracted, TRecord> {
  toExtractedKey: (item: TExtracted) => string | null;
  toRecordKey: (record: TRecord) => string | null;
  getExtractedStartDate: (item: TExtracted) => string | null;
  isChanged: (item: TExtracted, record: TRecord) => boolean;
}
