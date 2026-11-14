import type { CvSectionKey } from './cv-section-key.type.js';
import type { CvTextSections } from './cv-text-sections.type.js';

export interface CvSectionSplitState {
  current: CvSectionKey;
  sections: CvTextSections;
}
