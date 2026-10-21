import { MAX_SALARY_DIGITS } from "../constants/vacancies.constants";

const CURRENCY_PREFIX = "Bs ";
const RANGE_SEPARATOR = " - ";

function formatAmount(digits: string): string {
  const amount = digits.replace(/^0+(?=\d)/, "").slice(0, MAX_SALARY_DIGITS);
  return amount.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatSalaryInput(value: string, previous: string): string {
  const isRemovingSeparator =
    previous.endsWith(RANGE_SEPARATOR) && value.length < previous.length && !/\d$/.test(value);
  const normalized = value
    .replace(/[^\d\s-]/g, "")
    .replace(/^[\s-]+/, "")
    .replace(/[\s-]+/g, "-");
  const raw = isRemovingSeparator ? normalized.replace(/-$/, "") : normalized;
  if (!raw) return "";

  const [min, max] = raw.split("-");
  return raw.includes("-")
    ? `${CURRENCY_PREFIX}${formatAmount(min)}${RANGE_SEPARATOR}${formatAmount(max ?? "")}`
    : `${CURRENCY_PREFIX}${formatAmount(min)}`;
}

export function countDigits(text: string): number {
  return text.replace(/\D/g, "").length;
}

export function findCaretAfterDigits(formatted: string, digits: number): number {
  if (digits === 0) return Math.min(CURRENCY_PREFIX.length, formatted.length);
  let seen = 0;
  for (let index = 0; index < formatted.length; index++) {
    if (/\d/.test(formatted[index]) && ++seen === digits) return index + 1;
  }
  return formatted.length;
}
