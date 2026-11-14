import type { CvSectionKey } from './cv-section-key.type.js';

export type CvTextSections = Readonly<Record<CvSectionKey, readonly string[]>>;
