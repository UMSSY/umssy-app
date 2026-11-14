import { CV_FIELD_MAX_LENGTHS } from '../constants/cv-extraction.constants.js';
import { stripCvBullet } from './strip-cv-bullet.js';
import { truncateCvText } from './truncate-cv-text.js';

export function extractCvPresentation(
  presentationLines: readonly string[],
): string | null {
  const text = presentationLines.map(stripCvBullet).filter(Boolean).join(' ');
  return truncateCvText(text, CV_FIELD_MAX_LENGTHS.presentation);
}
