import type { WorkExperienceItem } from "../types/work-experience-item.types";
import { formatWorkPeriod } from "./format-work-period";

export function getCompanyGroupPeriod(
  positions: WorkExperienceItem[],
): string {
  if (positions.length === 0) {
    return "";
  }

  const oldestPosition = positions.reduce((oldest, current) =>
    current.startDate < oldest.startDate ? current : oldest,
  );

  const firstDate = formatWorkPeriod(
    oldestPosition.startDate,
    null,
    true,
  ).split(" – ")[0];

  const currentPosition = positions.find(
    (position) => position.isCurrent || !position.endDate,
  );

  if (currentPosition) {
    return `Primer cargo: ${firstDate} · Tiene un cargo actual`;
  }

  const latestEndPosition = positions.reduce((latest, current) =>
    (current.endDate ?? "") > (latest.endDate ?? "") ? current : latest,
  );

  const lastDate = latestEndPosition.endDate ?? latestEndPosition.startDate;

  const lastPeriod = formatWorkPeriod(
    lastDate,
    null,
    true,
  ).split(" – ")[0];

  return `Primer cargo: ${firstDate} · Último cargo: ${lastPeriod}`;
}
