import type { CvSectionSplitState } from '../types/cv-section-split-state.type.js';
import type { CvTextSections } from '../types/cv-text-sections.type.js';
import { detectCvSectionHeading } from './detect-cv-section-heading.js';

const EMPTY_SECTIONS: CvTextSections = {
  header: [],
  presentation: [],
  education: [],
  experience: [],
  skills: [],
  other: [],
};

function appendLine(
  state: CvSectionSplitState,
  line: string,
): CvSectionSplitState {
  const heading = detectCvSectionHeading(line);
  if (heading) return { ...state, current: heading };
  return {
    current: state.current,
    sections: {
      ...state.sections,
      [state.current]: [...state.sections[state.current], line],
    },
  };
}

export function splitCvSections(lines: readonly string[]): CvTextSections {
  return lines.reduce(appendLine, {
    current: 'header',
    sections: EMPTY_SECTIONS,
  }).sections;
}
