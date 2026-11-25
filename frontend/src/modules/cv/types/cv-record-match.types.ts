import type { CvRecordMatchStatus } from "./cv-record-match-status.types";

export type CvRecordMatch<TRecord> =
  | { status: Extract<CvRecordMatchStatus, "new"> }
  | { status: Exclude<CvRecordMatchStatus, "new">; record: TRecord };
