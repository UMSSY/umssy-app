import { HEATMAP_BASE_LABELS } from '../constants/heatmap.constants.js';
import type { HeatmapCareer } from '../types/heatmap-career.types.js';
import type { HeatmapCell } from '../types/heatmap-cell.types.js';
import type { HeatmapGraduate } from '../types/heatmap-graduate.types.js';
import type { HeatmapResponse } from '../types/heatmap-response.types.js';
import type { HeatmapRow } from '../types/heatmap-row.types.js';
import { shortenCareerTitle } from './heatmap-dates.util.js';
import {
  allSkills,
  countWithSkill,
  selectTopSkills,
} from './heatmap-skills.util.js';

const QUICK_READ_SKILLS_PER_CAREER = 2;

export function buildCareerHeatmap(
  graduates: HeatmapGraduate[],
  careers: HeatmapCareer[],
  careerId?: string,
): HeatmapResponse {
  const shownCareers = careerId
    ? careers.filter((career) => career.id === careerId)
    : careers;
  const shownIds = new Set(shownCareers.map((career) => career.id));
  const base = graduates.filter(
    (graduate) => graduate.skills.length > 0 && shownIds.has(graduate.careerId),
  );
  const groups = shownCareers.map((career) => ({
    career,
    label: shortenCareerTitle(career.title),
    graduates: base.filter((graduate) => graduate.careerId === career.id),
  }));
  const rows: HeatmapRow[] = selectTopSkills(base, allSkills).map((skill) => ({
    skillId: skill.id,
    skillName: skill.name,
    cells: groups.map((group) =>
      buildCareerCell(
        group.career.id,
        countWithSkill(group.graduates, skill.id, allSkills),
        group.graduates.length,
      ),
    ),
  }));

  return {
    heatmapType: 'skills-by-career',
    baseCount: base.length,
    baseLabel: HEATMAP_BASE_LABELS['skills-by-career'],
    columns: groups.map((group) => ({
      id: group.career.id,
      label: group.label,
      sublabel: `(n = ${group.graduates.length})`,
      total: group.graduates.length,
    })),
    rows,
    quickReadSummary: summarize(rows, groups),
  };
}

function toOneDecimalPercentage(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
}

function buildCareerCell(
  columnId: string,
  count: number,
  total: number,
): HeatmapCell {
  if (total <= 0) return { columnId, count: 0, total: 0, isEmpty: true };
  return {
    columnId,
    count,
    total,
    percentage: toOneDecimalPercentage(count, total),
    isEmpty: false,
  };
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}%`;
}

function joinSkills(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`;
}

function summarize(
  rows: HeatmapRow[],
  groups: {
    career: HeatmapCareer;
    label: string;
    graduates: HeatmapGraduate[];
  }[],
): string | undefined {
  const sentences = groups
    .filter((group) => group.graduates.length > 0)
    .map((group) => {
      const top = rows
        .map((row) => ({
          name: row.skillName,
          cell: row.cells.find((cell) => cell.columnId === group.career.id),
        }))
        .filter(({ cell }) => cell && !cell.isEmpty && (cell.count ?? 0) > 0)
        .sort(
          (first, second) =>
            (second.cell!.percentage ?? 0) - (first.cell!.percentage ?? 0) ||
            first.name.localeCompare(second.name, 'es'),
        )
        .slice(0, QUICK_READ_SKILLS_PER_CAREER);
      if (top.length === 0) return undefined;
      const skills = joinSkills(
        top.map(
          ({ name, cell }) =>
            `${name} (${formatPercentage(cell!.percentage ?? 0)})`,
        ),
      );
      const verb = top.length > 1 ? 'tienen' : 'tiene';
      return `En ${group.label}, ${skills} ${verb} mayor presencia.`;
    })
    .filter((sentence): sentence is string => Boolean(sentence));

  return sentences.length > 0 ? sentences.join(' ') : undefined;
}
