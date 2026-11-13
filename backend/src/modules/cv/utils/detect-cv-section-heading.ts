import { normalizeTerm } from '../../nlp/utils/normalize-term.js';
import {
  CV_HEADING_EDGE_PATTERN,
  CV_SECTION_HEADINGS,
} from '../constants/cv-extraction.constants.js';
import type { CvSectionKey } from '../types/cv-section-key.type.js';

export function detectCvSectionHeading(line: string): CvSectionKey | null {
  const normalized = normalizeTerm(line).replace(CV_HEADING_EDGE_PATTERN, '');
  return (
    CV_SECTION_HEADINGS.find((section) => section.headings.includes(normalized))
      ?.key ?? null
  );
}
