import { CV_NAME_WORD_LIMITS } from '../constants/cv-extraction.constants.js';
import type { CvPersonName } from '../types/cv-person-name.type.js';

const toTitleCase = (word: string): string =>
  `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;

export function splitCvPersonName(fullName: string): CvPersonName {
  const isUpperCase = fullName === fullName.toUpperCase();
  const words = fullName
    .split(' ')
    .filter((word) => word.length > 0)
    .map((word) => (isUpperCase ? toTitleCase(word) : word));
  const firstNameWords =
    words.length >= CV_NAME_WORD_LIMITS.compoundFirstNameFrom
      ? CV_NAME_WORD_LIMITS.compoundFirstNameWords
      : 1;
  const lastName = words.slice(firstNameWords).join(' ');
  return {
    firstName: words.slice(0, firstNameWords).join(' '),
    lastName: lastName || null,
  };
}
