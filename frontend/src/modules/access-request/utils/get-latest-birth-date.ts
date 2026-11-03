import { MIN_AGE } from "./validate-personal-data";

export function getLatestBirthDate(now: Date = new Date()): string {
  const latest = new Date(now.getFullYear() - MIN_AGE, now.getMonth(), now.getDate());
  const month = String(latest.getMonth() + 1).padStart(2, "0");
  const day = String(latest.getDate()).padStart(2, "0");
  return `${latest.getFullYear()}-${month}-${day}`;
}
