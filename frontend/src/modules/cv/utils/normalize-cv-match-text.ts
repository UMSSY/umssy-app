import { CV_MATCH_DIACRITICS_PATTERN, CV_MATCH_WHITESPACE_PATTERN } from "../constants/cv-record-match.constants";

export function normalizeCvMatchText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(CV_MATCH_DIACRITICS_PATTERN, "")
    .replace(CV_MATCH_WHITESPACE_PATTERN, " ")
    .trim()
    .toLowerCase();
}
