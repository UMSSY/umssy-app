import type { CvDateRange } from './cv-date-range.type.js';

export interface CvTextEntry {
  headerParts: readonly string[];
  dateRange: CvDateRange | null;
  bodyLines: readonly string[];
}
