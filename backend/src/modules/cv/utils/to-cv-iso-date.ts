import { CV_DATE_LIMITS } from '../constants/cv-extraction.constants.js';

const pad = (value: number): string => String(value).padStart(2, '0');

export function toCvIsoDate(
  year: string | undefined,
  month: number | undefined,
  referenceYear: number = new Date().getFullYear(),
): string | null {
  const numericYear = Number(year);
  const isValidYear =
    Number.isInteger(numericYear) &&
    numericYear >= CV_DATE_LIMITS.minYear &&
    numericYear <= referenceYear + CV_DATE_LIMITS.maxYearsAhead;
  if (!isValidYear) return null;
  return `${numericYear}-${pad(month ?? CV_DATE_LIMITS.defaultMonth)}-${pad(CV_DATE_LIMITS.defaultDay)}`;
}
