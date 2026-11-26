import { CV_PART_SEPARATOR_PATTERN } from '../constants/cv-extraction.constants.js';

export function splitCvParts(text: string | null | undefined): string[] {
  return (text ?? '')
    .split(CV_PART_SEPARATOR_PATTERN)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}
