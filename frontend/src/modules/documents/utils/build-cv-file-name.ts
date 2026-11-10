import { CV_EXPORT_FILE_EXTENSION, CV_EXPORT_FILE_PREFIX } from "../constants/cv-export.constants";

const DIACRITICS_PATTERN = /[̀-ͯ]/g;
const UNSAFE_CHARACTERS_PATTERN = /[^A-Za-z0-9]+/g;
const EDGE_SEPARATORS_PATTERN = /^_+|_+$/g;

function toFileNamePart(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .replace(UNSAFE_CHARACTERS_PATTERN, "_")
    .replace(EDGE_SEPARATORS_PATTERN, "");
}

export function buildCvFileName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  const parts = [firstName, lastName].map(toFileNamePart).filter((part) => part.length > 0);

  return `${[CV_EXPORT_FILE_PREFIX, ...parts].join("_")}${CV_EXPORT_FILE_EXTENSION}`;
}
