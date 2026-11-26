import type { SurveyQuestionTrendResponse } from '../responses/survey-statistics.response.js';
import type {
  TrendChange,
  TrendComparison,
  TrendInput,
  TrendOption,
} from '../types/survey-statistics.type.js';

function formatPercentage(value: number): string {
  return `${Number(value.toFixed(1))}%`;
}

function joinLabels(labels: readonly string[]): string {
  const quoted = labels.map((label) => `«${label}»`);
  if (quoted.length <= 1) return quoted.join('');
  return `${quoted.slice(0, -1).join(', ')} y ${quoted[quoted.length - 1]}`;
}

function describeChange(
  top: TrendOption,
  comparison: TrendComparison | undefined,
): TrendChange {
  if (!comparison || comparison.percentageByOption.size === 0) {
    return { direction: 'neutral', sentence: '' };
  }

  const change = Number(
    (top.percentage - (comparison.percentageByOption.get(top.id) ?? 0)).toFixed(
      1,
    ),
  );
  if (change >= 1) {
    return {
      direction: 'up',
      sentence: ` Sube ${change} pts frente a ${comparison.period}.`,
    };
  }
  if (change <= -1) {
    return {
      direction: 'down',
      sentence: ` Baja ${Math.abs(change)} pts frente a ${comparison.period}.`,
    };
  }
  return {
    direction: 'neutral',
    sentence: ` Se mantiene estable frente a ${comparison.period}.`,
  };
}

export function buildQuestionTrend({
  options,
  totalSelections,
  isMultipleChoice,
  comparison,
}: TrendInput): SurveyQuestionTrendResponse {
  if (totalSelections <= 0) {
    return {
      text: 'Sin respuestas registradas en este periodo.',
      direction: 'neutral',
    };
  }

  const maxCount = Math.max(...options.map((option) => option.count));
  const leaders = options.filter((option) => option.count === maxCount);

  if (leaders.length > 1) {
    const labels = joinLabels(leaders.map((option) => option.label));
    return {
      text: `Hay un empate entre ${labels} con ${formatPercentage(leaders[0].percentage)} cada una.`,
      direction: 'neutral',
    };
  }

  const [top] = leaders;
  const unit = isMultipleChoice ? 'selecciones' : 'respuestas';
  const lead = `La opción más elegida es «${top.label}» con ${formatPercentage(top.percentage)} (${top.count} de ${totalSelections} ${unit}).`;
  const { direction, sentence } = describeChange(top, comparison);

  return { text: `${lead}${sentence}`, direction };
}
