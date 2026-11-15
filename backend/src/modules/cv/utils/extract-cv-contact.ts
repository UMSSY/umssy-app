import {
  personalEmailSchema,
  phoneSchema,
} from '../../profile/requests/profile-fields.schema.js';
import {
  CV_COUNTRY_PATTERN,
  CV_DATE_RANGE_PATTERN,
  CV_DIGIT_PATTERN,
  CV_EMAIL_PATTERN,
  CV_FIELD_MAX_LENGTHS,
  CV_LOCATION_LABEL_PATTERN,
  CV_NAME_EXCLUDED_TERMS,
  CV_NAME_LABEL_PATTERN,
  CV_NAME_WORD_LIMITS,
  CV_NAME_WORD_PATTERN,
  CV_PHONE_CANDIDATE_PATTERN,
  CV_PHONE_LABEL_PATTERN,
} from '../constants/cv-extraction.constants.js';
import type { CvExtractedContactResponse } from '../responses/cv-extracted-contact.response.js';
import { normalizeTerm } from '../../nlp/utils/normalize-term.js';
import { splitCvPersonName } from './split-cv-person-name.js';
import { truncateCvText } from './truncate-cv-text.js';

function findEmail(lines: readonly string[]): string | null {
  return (
    lines
      .flatMap((line) => line.match(CV_EMAIL_PATTERN) ?? [])
      .find((candidate) => personalEmailSchema.safeParse(candidate).success) ??
    null
  );
}

function findPhone(
  headerLines: readonly string[],
  lines: readonly string[],
): string | null {
  const labelledLines = lines.filter((line) =>
    CV_PHONE_LABEL_PATTERN.test(line),
  );
  return (
    [...headerLines, ...labelledLines]
      .flatMap((line) => line.match(CV_PHONE_CANDIDATE_PATTERN) ?? [])
      .map((candidate) => candidate.trim())
      .find(
        (candidate) =>
          !CV_DATE_RANGE_PATTERN.test(candidate) &&
          phoneSchema.safeParse(candidate).success,
      ) ?? null
  );
}

function isPersonNameLine(line: string): boolean {
  const words = line.split(' ');
  return (
    !CV_NAME_EXCLUDED_TERMS.includes(normalizeTerm(line)) &&
    words.length >= CV_NAME_WORD_LIMITS.min &&
    words.length <= CV_NAME_WORD_LIMITS.max &&
    words.every((word) => CV_NAME_WORD_PATTERN.test(word))
  );
}

function findLocation(
  headerLines: readonly string[],
  lines: readonly string[],
): string | null {
  const labelled = lines
    .map((line) => CV_LOCATION_LABEL_PATTERN.exec(line)?.groups?.value)
    .find((value) => Boolean(value));
  const countryLine = headerLines.find(
    (line) =>
      CV_COUNTRY_PATTERN.test(line) &&
      !line.includes('@') &&
      !CV_DIGIT_PATTERN.test(line),
  );
  return truncateCvText(labelled ?? countryLine, CV_FIELD_MAX_LENGTHS.location);
}

export function extractCvContact(
  headerLines: readonly string[],
  lines: readonly string[],
): Omit<CvExtractedContactResponse, 'cityId'> {
  const fullName = headerLines
    .map((line) => line.replace(CV_NAME_LABEL_PATTERN, '').trim())
    .find(isPersonNameLine);
  const name = fullName ? splitCvPersonName(fullName) : null;
  return {
    firstName: truncateCvText(name?.firstName, CV_FIELD_MAX_LENGTHS.personName),
    lastName: truncateCvText(name?.lastName, CV_FIELD_MAX_LENGTHS.personName),
    email: findEmail(lines),
    phone: findPhone(headerLines, lines),
    location: findLocation(headerLines, lines),
  };
}
