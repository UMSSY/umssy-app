import type { ParsedSalary } from "../types/parsed-salary.types";
export function parseSalary(value: string): ParsedSalary {
  const cleaned = value.replace(/[^\d-]/g, "");
  if (cleaned === "") {
    return { min: null, max: null, isIncomplete: false };
  }

  const parts = cleaned.split("-");
  const min = parts[0] ? Number.parseInt(parts[0], 10) : null;
  const max = parts[1] ? Number.parseInt(parts[1], 10) : null;
  const hasSeparator = parts.length > 1;
  const isIncomplete = parts.length > 2 || (hasSeparator && (min === null || max === null));

  return { min, max, isIncomplete };
}
