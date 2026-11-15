import type { CvSectionKey } from './cv-section-key.type.js';

export interface CvSectionHeading {
  key: CvSectionKey;
  headings: readonly string[];
}
