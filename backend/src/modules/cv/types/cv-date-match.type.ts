import type { CvDateRange } from './cv-date-range.type.js';

export interface CvDateMatch {
  range: CvDateRange;
  remainder: string;
}
